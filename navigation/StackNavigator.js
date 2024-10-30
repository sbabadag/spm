import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // Hide the header for HomeScreen
        />
        <Stack.Screen 
          name="Upload" 
          component={UploadScreen} 
          options={{ headerShown: false }} // Hide the header for UploadScreen as well
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;