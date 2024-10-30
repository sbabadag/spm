import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, Platform, TextInput, ProgressBar, FlatList } from 'react-native';
import { ref, set, push } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { database } from '../firebaseConfig'; // Adjust the import path as needed

const CreateProjectScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [xsrFile, setXsrFile] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleXsrUpload = (event) => {
    const file = event.target.files[0];
    setXsrFile(file);
  };

  const handlePdfUpload = (event) => {
    const files = Array.from(event.target.files);
    setPdfFiles(files);
  };

  const parseXsrFile = async (file) => {
    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n');
      const records = [];
      const dataStartIndex = lines.findIndex(line => line && line.includes('Asmbly Pos.')) + 1;

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line && line.match(/^\S+\s+\d+\s+\S+\s+\S+\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/)) {
          const columns = line.split(/\s+/);
          if (columns.length < 6) {
            throw new Error(`Invalid line format: ${line}`);
          }
          const record = {
            POSNO: columns[0],
            Quantity: columns[1],
            Profile: columns[3],
            Weight: columns[5],
            ProjectName: projectName
          };
          records.push(record);
        }
      }
      return records;
    } catch (error) {
      Alert.alert('Error', `Failed to parse file: ${error.message}`);
      console.error('Error parsing file:', error);
      return [];
    }
  };

  const uploadPdfFiles = async () => {
    const storage = getStorage();
    const uploadPromises = pdfFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const storageReference = storageRef(storage, `pdfs/${file.name}`);
        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve({ fileName: file.name, downloadURL });
            });
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const pairPdfFilesWithRecords = (records, uploadedFiles) => {
    const pairedRecords = records.map(record => {
      const posno = record.POSNO.replace('/', '');
      const pdfFile = uploadedFiles.find(file => {
        const fileName = file.fileName.split(' ')[0];
        return fileName === posno || fileName === record.POSNO;
      });
      return {
        ...record,
        PdfFileName: pdfFile ? pdfFile.fileName : null,
        PdfFileURL: pdfFile ? pdfFile.downloadURL : null
      };
    });
    return pairedRecords;
  };

  const handleUploadData = async () => {
    if (!xsrFile || pdfFiles.length === 0) {
      Alert.alert('Error', 'Please upload both XSR and PDF files.');
      return;
    }

    try {
      setLoading(true);
      const records = await parseXsrFile(xsrFile);
      const uploadedFiles = await uploadPdfFiles();
      const pairedRecords = pairPdfFilesWithRecords(records, uploadedFiles);
      const newProjectRef = push(ref(database, 'projects/'));
      await set(newProjectRef, {
        projectName: projectName,
        records: pairedRecords
      });
      console.log('Project and records saved to Firebase');
      setUploadComplete(true);
    } catch (error) {
      console.error('Error saving project to Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter Project Name"
        value={projectName}
        onChangeText={setProjectName}
      />
      {Platform.OS === 'web' && (
        <>
          <input
            type="file"
            accept=".xsr"
            onChange={handleXsrUpload}
            style={styles.fileInput}
          />
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handlePdfUpload}
            style={styles.fileInput}
          />
        </>
      )}
      {loading && (
        <View style={styles.progressContainer}>
          <Text>Uploading PDF files...</Text>
          <ProgressBar styleAttr="Horizontal" indeterminate={false} progress={uploadProgress / 100} />
        </View>
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={handleUploadData}
      >
        <Text style={styles.buttonText}>Upload Data</Text>
      </TouchableOpacity>
      {uploadComplete && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  fileInput: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  input: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    width: '80%',
    marginBottom: 20,
  },
});

export default CreateProjectScreen;