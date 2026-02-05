import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

interface AuthContextData {
  user: any;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Fetch user data from server
        try {
          const response = await client.get('/users/me');
          setUser(response.data);
        } catch (err) {
          // If token invalid, clear storage
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const login = async (token: string) => {
    await AsyncStorage.setItem('token', token);
    const response = await client.get('/users/me');
    setUser(response.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
