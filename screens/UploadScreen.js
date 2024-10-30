import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, Platform, ScrollView, TextInput } from 'react-native';
import { ref, set } from 'firebase/database';
import { database } from '../firebaseConfig'; // Adjust the import path as needed

const UploadScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const fileContent = await file.text();
        const parsedRecords = parseXsrFile(fileContent);
        saveRecordsToFirebase(parsedRecords);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file');
      console.error('Error uploading file:', error);
    }
  };

  const parseXsrFile = (content) => {
    try {
      const lines = content.split('\n');
      const records = [];
      const dataStartIndex = lines.findIndex(line => line && line.startsWith('A/')) || 0;

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line && (line.startsWith('A/') || line.startsWith('B/') || line.startsWith('C/'))) {
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

  const saveRecordsToFirebase = (records) => {
    const recordsRef = ref(database, 'records/');
    set(recordsRef, records)
      .then(() => {
        console.log('Records saved to Firebase');
        navigation.navigate('Home');
      })
      .catch((error) => {
        console.error('Error saving records to Firebase:', error);
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter Project Name"
        value={projectName}
        onChangeText={setProjectName}
      />
      {Platform.OS === 'web' && (
        <input
          type="file"
          accept=".xsr"
          onChange={handleFileUpload}
          style={styles.fileInput}
        />
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
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
});

export default UploadScreen;