import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, TextInput, ScrollView, Platform, Dimensions, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ProgressBar } from 'react-native-paper';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebaseConfig'; // Adjust the import path as needed

const HomeScreen = ({ navigation, route }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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
      if (selectedProject) {
        setFilteredRecords(selectedProject.records.slice(0, 5)); // Load initial 5 records
        setPage(1);
      }
    }
  };

  const loadMore = (direction) => {
    if (!isFetchingMore && selectedProject) {
      setIsFetchingMore(true);
      const nextPage = direction === 'next' ? page + 1 : page - 1;
      const startIndex = (nextPage - 1) * 5;
      const selectedProjectData = projects.find(project => project.id === selectedProject);
      if (selectedProjectData) {
        const newRecords = selectedProjectData.records.slice(startIndex, startIndex + 5);
        setFilteredRecords(newRecords);
        setPage(nextPage);
      }
      setIsFetchingMore(false);
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
  };

  const calculateProgress = () => {
    const totalQuantity = filteredRecords.reduce((sum, record) => sum + parseFloat(record.Quantity || 0), 0);
    const totalQuantityDone = filteredRecords.reduce((sum, record) => sum + parseFloat(record.QuantityDone || 0), 0);
    return totalQuantity ? totalQuantityDone / totalQuantity : 0;
  };

  const renderTableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableHeader]}>Quantity Done</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Quantity Sent</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>POSNO</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Quantity</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Profile</Text>
      <Text style={[styles.tableCell, styles.tableHeader]}>Weight</Text>
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
        <Text style={styles.pdfButtonText}>Open PDF</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Project</Text>
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
      <View style={styles.progressContainer}>
        <Text>Progress: {Math.round(calculateProgress() * 100)}%</Text>
        <ProgressBar progress={calculateProgress()} style={styles.progressBar} />
      </View>
      {Platform.OS === 'web' ? (
        <ScrollView style={styles.tableContainer} contentContainerStyle={styles.scrollContent}>
          {renderTableHeader()}
          {filteredRecords.map((item, index) => renderTableRow({ item, index }))}
          {isFetchingMore && <ActivityIndicator size="large" color="#007bff" />}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderTableHeader}
          renderItem={renderTableRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.table}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <ActivityIndicator size="large" color="#007bff" /> : null}
        />
      )}
      <View style={styles.paginationContainer}>
        <Button title="Previous" onPress={() => loadMore('prev')} disabled={page === 1} />
        <Button title="Next" onPress={() => loadMore('next')} />
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading PDF...</Text>
        </View>
      )}
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
  tableContainer: {
    width: '100%',
    marginTop: 20,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
});

export default HomeScreen;