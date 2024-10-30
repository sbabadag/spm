import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig'; // Adjust the import path as needed

const HomeScreen = ({ navigation, route }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const projectsRef = ref(database, 'projects/');
    onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProjects(projectList);

        // If a projectId is passed from the CreateProjectScreen, select that project
        if (route.params?.projectId) {
          handleProjectChange(route.params.projectId);
        }
      }
    });
  }, [route.params?.projectId]);

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    if (projectId.trim() === '') {
      setFilteredRecords([]);
    } else {
      const selectedProject = projects.find(project => project.id === projectId);
      setFilteredRecords(selectedProject.records);
    }
  };

  const openPdf = async (url) => {
    setLoading(true);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Picker
        selectedValue={selectedProject}
        style={styles.picker}
        onValueChange={(itemValue) => handleProjectChange(itemValue)}
      >
        <Picker.Item label="Select Project" value="" />
        {projects.map((project) => (
          <Picker.Item key={project.id} label={project.projectName} value={project.id} />
        ))}
      </Picker>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeader]}>POSNO</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Quantity</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Profile</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Weight</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>PDF</Text>
        </View>
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.POSNO}</Text>
              <Text style={styles.tableCell}>{item.Quantity}</Text>
              <Text style={styles.tableCell}>{item.Profile}</Text>
              <Text style={styles.tableCell}>{item.Weight}</Text>
              <TouchableOpacity
                style={[styles.pdfButton, !item.PdfFileURL && styles.pdfButtonDisabled]}
                onPress={() => openPdf(item.PdfFileURL)}
                disabled={!item.PdfFileURL}
              >
                <Text style={styles.pdfButtonText}>Open PDF</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading PDF...</Text>
        </View>
      )}
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
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#cccccc',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  separator: {
    height: 1,
    backgroundColor: '#cccccc',
    width: '100%',
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 20,
  },
  pdfButton: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 5,
  },
  pdfButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
});

export default HomeScreen;