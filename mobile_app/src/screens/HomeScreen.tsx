import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState({ total_scans: 0, sick_cases: 0, accuracy: 0 });
  const [userName, setUserName] = useState('Người dùng');

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const fetchStats = async () => {
    try {
      const response = await client.get('/users/me/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await client.get('/users/me');
      setUserName(response.data.full_name);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      fetchUserProfile();
    }, [])
  );

  const menuItems = [
    { title: 'Chẩn đoán bệnh', subtitle: 'Phân tích qua phân', icon: 'microscope', screen: 'Classify', color: '#4caf50' },
    { title: 'Kiểm tra đàn', subtitle: 'Phát hiện gà ốm', icon: 'camera-burst', screen: 'Detect', color: '#2196f3' },
    { title: 'Hỏi đáp AI', subtitle: 'Trợ lý ảo 24/7', icon: 'robot', screen: 'Chat', color: '#00bcd4' },
    { title: 'Kiến thức', subtitle: 'Cẩm nang chăn nuôi', icon: 'book-open-variant', screen: 'Knowledge', color: '#ff9800' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, {userName}</Text>
            <Text style={styles.appName}>ChickHealth Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total_scans}</Text>
            <Text style={styles.statLabel}>Chẩn đoán</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.sick_cases}</Text>
            <Text style={styles.statLabel}>Bệnh lạ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Dịch vụ chính</Text>
        
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.9}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Icon name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2e7d32',
    paddingTop: 40,
    paddingBottom: 60, // Make room for stats card
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  appName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    position: 'absolute',
    bottom: -40,
    left: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#eee',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;
