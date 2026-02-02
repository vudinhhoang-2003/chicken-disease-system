import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ClassifyScreen from '../screens/ClassifyScreen';
import DetectScreen from '../screens/DetectScreen';
import ChatScreen from '../screens/ChatScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" 
        screenOptions={{ 
          headerShown: false,
          headerStyle: {
            backgroundColor: '#2e7d32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Classify" component={ClassifyScreen} options={{ headerShown: true, title: 'Chẩn đoán bệnh' }} />
        <Stack.Screen name="Detect" component={DetectScreen} options={{ headerShown: true, title: 'Kiểm tra đàn' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Hỏi đáp AI' }} />
        <Stack.Screen name="Knowledge" component={KnowledgeScreen} options={{ headerShown: true, title: 'Kiến thức' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Nhật ký sức khỏe' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
