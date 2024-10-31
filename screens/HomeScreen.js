import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, TextInput, Platform, Dimensions, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ProgressBar } from 'react-native-paper';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebaseConfig'; // Adjust the import path as needed

const HomeScreen = ({ navigation, route }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalQuantityDone, setTotalQuantityDone] = useState(0);
  const [selectedPOSNO, setSelectedPOSNO] = useState('');
  const [quantity, setQuantity] = useState('');

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
      setTotalQuantity(0);
      setTotalQuantityDone(0);
    } else {
      const selectedProject = projects.find(project => project.id === projectId);
      if (selectedProject) {
        setFilteredRecords(selectedProject.records); // Load all records
        setTotalQuantity(selectedProject.records.reduce((sum, record) => sum + parseFloat(record.Quantity || 0), 0));
        setTotalQuantityDone(selectedProject.records.reduce((sum, record) => sum + parseFloat(record.QuantityDone || 0), 0));
      }
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

  const handleQuantityChange = (index, field, value) => {
    const updatedRecords = [...filteredRecords];
    updatedRecords[index][field] = value;
    setFilteredRecords(updatedRecords);

    // Update the database
    const projectRef = ref(database, `projects/${selectedProject}/records/${index}`);
    update(projectRef, { [field]: value });

    // Update total quantities
    const selectedProjectData = projects.find(project => project.id === selectedProject);
    if (selectedProjectData) {
      setTotalQuantity(selectedProjectData.records.reduce((sum, record) => sum + parseFloat(record.Quantity || 0), 0));
      setTotalQuantityDone(selectedProjectData.records.reduce((sum, record) => sum + parseFloat(record.QuantityDone || 0), 0));
    }
  };

  const calculateProgress = () => {
    return totalQuantity ? totalQuantityDone / totalQuantity : 0;
  };

  const handleAddProduction = () => {
    if (!selectedPOSNO || !quantity) {
      Alert.alert('Hata', 'Lütfen bir POSNO seçin ve bir miktar girin.');
      return;
    }

    const selectedProjectData = projects.find(project => project.id === selectedProject);
    if (selectedProjectData) {
      const recordIndex = selectedProjectData.records.findIndex(record => record.POSNO === selectedPOSNO);
      if (recordIndex !== -1) {
        const updatedRecords = [...selectedProjectData.records];
        updatedRecords[recordIndex].QuantityDone = parseFloat(updatedRecords[recordIndex].QuantityDone || 0) + parseFloat(quantity);
        updatedRecords[recordIndex].Date = new Date().toISOString();

        // Update the database
        const projectRef = ref(database, `projects/${selectedProject}/records/${recordIndex}`);
        update(projectRef, { QuantityDone: updatedRecords[recordIndex].QuantityDone, Date: updatedRecords[recordIndex].Date });

        // Update state
        setFilteredRecords(updatedRecords);
        setTotalQuantityDone(updatedRecords.reduce((sum, record) => sum + parseFloat(record.QuantityDone || 0), 0));
        setQuantity('');
      }
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableHeader]}>Yapılan Miktar</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Gönderilen Miktar</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>POSNO</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Miktar</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Profil</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Ağırlık</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>PDF</Text>
    </View>
  );

  const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <TextInput
        style={styles.tableCell}
        value={item.QuantityDone?.toString() || ''}
        onChangeText={(value) => handleQuantityChange(index, 'QuantityDone', value)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.tableCell}
        value={item.QuantitySent?.toString() || ''}
        onChangeText={(value) => handleQuantityChange(index, 'QuantitySent', value)}
        keyboardType="numeric"
      />
      <Text style={styles.tableCell}>{item.POSNO}</Text>
      <Text style={styles.tableCell}>{item.Quantity}</Text>
      <Text style={styles.tableCell}>{item.Profile}</Text>
      <Text style={styles.tableCell}>{item.Weight}</Text>
      <TouchableOpacity
        style={[styles.pdfButton, !item.PdfFileURL && styles.pdfButtonDisabled]}
        onPress={() => openPdf(item.PdfFileURL)}
        disabled={!item.PdfFileURL}
      >
        <Text style={styles.pdfButtonText}>PDF Aç</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Proje Seç</Text>
      <Picker
        selectedValue={selectedProject}
        style={styles.picker}
        onValueChange={(itemValue) => handleProjectChange(itemValue)}
      >
        <Picker.Item label="Proje Seç" value="" />
        {projects.map((project) => (
          <Picker.Item key={project.id} label={project.projectName} value={project.id} />
        ))}
      </Picker>
      <View style={styles.progressContainer}>
        <Text>İlerleme: {Math.round(calculateProgress() * 100)}%</Text>
        <ProgressBar progress={calculateProgress()} style={styles.progressBar} />
      </View>
      <View style={styles.productionEntryContainer}>
        <Picker
          selectedValue={selectedPOSNO}
          style={styles.productionPicker}
          onValueChange={(itemValue) => setSelectedPOSNO(itemValue)}
        >
          <Picker.Item label="POSNO Seç" value="" />
          {projects.find(project => project.id === selectedProject)?.records.map((record) => (
            <Picker.Item key={record.POSNO} label={record.POSNO} value={record.POSNO} />
          ))}
        </Picker>
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Miktar girin"
          keyboardType="numeric"
        />
        <Button title="Üretim Ekle" onPress={handleAddProduction} />
      </View>
      <ScrollView style={styles.tableContainer} contentContainerStyle={styles.scrollContent}>
        {renderTableHeader()}
        {filteredRecords.map((item, index) => renderTableRow({ item, index }))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>PDF Yükleniyor...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the container takes up the full height of the screen
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
  productionEntryContainer: {
    width: '80%',
    flexDirection: 'column', // Change to column to stack elements vertically
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff', // Add background color for better visibility
    padding: 10, // Add padding for spacing
    borderRadius: 5, // Add border radius for rounded corners
    shadowColor: '#000', // Add shadow for better visibility
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2, // Add elevation for Android shadow
    marginBottom: 20, // Add margin bottom for spacing
  },
  productionPicker: {
    width: '100%', // Ensure the picker takes up the full width
    marginBottom: 10, // Add margin bottom for spacing
  },
  quantityInput: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10, // Add margin bottom for spacing
    width: '100%', // Ensure the input takes up the full width
  },
  tableContainer: {
    width: '100%',
    marginTop: 20,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    width: Dimensions.get('window').width - 32, // Adjust the width to fit the screen
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    flex: 1,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#cccccc',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    color: 'red', // Set header text color to red
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
    marginTop: 10, // Add marginTop to create space above the picker
  },
  progressContainer: {
    width: '80%',
    marginBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
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