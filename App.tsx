import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { database } from './firebaseConfig';
import { ref, onValue, push, update } from 'firebase/database';
import * as DocumentPicker from 'expo-document-picker';

export default function App() {
  const [data, setData] = useState<{ id: string; projectname: string; ASS_POS: string; TotalQuantity: number; profilename: string; weight: number; [key: string]: any }[]>([]);
  const [filteredData, setFilteredData] = useState(data);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    const dbRef = ref(database, 'records'); // Replace 'records' with your actual database path
    onValue(dbRef, (snapshot) => {
      const records = snapshot.val();
      const dataList = records ? Object.keys(records).map(key => ({ id: key, ...records[key] })) : [];
      setData(dataList);
      setFilteredData(dataList);
      const uniqueProjectNames = Array.from(new Set(dataList.map(item => item.projectname)));
      setProjectNames(uniqueProjectNames);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setFilteredData(data.filter(item => item.projectname === selectedProject));
    } else {
      setFilteredData(data);
    }
  }, [selectedProject, data]);

  const loadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/plain' });
      if (result.type === 'success') {
        const successResult = result as DocumentPicker.DocumentPickerSuccessResult;
        const content = await fetch(successResult.uri).then(res => res.text());
        setFileContent(content);
        Alert.alert('File Loaded', 'File loaded successfully. You can now upload it.');
        console.log('File content loaded:', content); // Log file content
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load file');
      console.error('Error loading file:', error); // Log error
    }
  };

  const parseAndUploadFile = () => {
    if (!fileContent) {
      Alert.alert('Error', 'No file loaded');
      return;
    }

    const lines = fileContent.split('\n');
    const parsedData = lines.slice(5, -2).map(line => {
      const columns = line.split(/\s+/);
      return {
        ASS_POS: columns[0],
        TotalQuantity: parseInt(columns[1], 10),
        profilename: columns[3],
        weight: parseFloat(columns[5])
      };
    }).filter(record => record.ASS_POS); // Filter out empty records
    console.log('Parsed data:', parsedData); // Log parsed data
    saveToDatabase(parsedData);
    setFilteredData(parsedData); // Update the state with the parsed data
    Alert.alert('Upload Complete', 'File parsed and uploaded successfully.');
  };

  const saveToDatabase = (parsedData: any[]) => {
    const dbRef = ref(database, 'records'); // Replace 'records' with your actual database path
    parsedData.forEach(record => {
      const newRecord = {
        projectname: projectName,
        ...record
      };
      push(dbRef, newRecord);
    });
  };

  const updateRecord = (id: string, updatedData: Partial<{ projectname: string; ASS_POS: string; TotalQuantity: number; profilename: string; weight: number; [key: string]: any }>) => {
    const dbRef = ref(database, `records/${id}`); // Replace 'records' with your actual database path
    update(dbRef, updatedData);
  };

  const renderItem = ({ item }: { item: { id: string; projectname: string; ASS_POS: string; TotalQuantity: number; profilename: string; weight: number; [key: string]: any } }) => (
    <View style={styles.row}>
      <TextInput
        style={styles.cell}
        placeholder="ASS_POS"
        value={item.ASS_POS}
        onChangeText={(text) => updateRecord(item.id, { ASS_POS: text })}
      />
      <TextInput
        style={styles.cell}
        placeholder="TotalQuantity"
        value={String(item.TotalQuantity)}
        onChangeText={(text) => updateRecord(item.id, { TotalQuantity: Number(text) })}
      />
      <TextInput
        style={styles.cell}
        placeholder="Profilename"
        value={item.profilename}
        onChangeText={(text) => updateRecord(item.id, { profilename: text })}
      />
      <TextInput
        style={styles.cell}
        placeholder="Weight"
        value={String(item.weight)}
        onChangeText={(text) => updateRecord(item.id, { weight: Number(text) })}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Project Name"
        value={projectName}
        onChangeText={setProjectName}
      />
      <Button title="Load File" onPress={loadFile} />
      <Button title="Upload File" onPress={parseAndUploadFile} />
      <Picker
        selectedValue={selectedProject}
        onValueChange={(itemValue) => setSelectedProject(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="All Projects" value="" />
        {projectNames.map((projectname) => (
          <Picker.Item key={projectname} label={projectname} value={projectname} />
        ))}
      </Picker>
      <View style={styles.table}>
        <View style={styles.header}>
          <Text style={styles.headerCell}>ASS_POS</Text>
          <Text style={styles.headerCell}>TotalQuantity</Text>
          <Text style={styles.headerCell}>Profilename</Text>
          <Text style={styles.headerCell}>Weight</Text>
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  table: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    padding: 10,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
  },
});