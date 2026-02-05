import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Vì đã dùng 'adb reverse tcp:8000 tcp:8000', ta có thể dùng localhost trên Android
const BASE_URL = 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout default
});

// Tự động thêm Token vào mỗi request nếu có
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
