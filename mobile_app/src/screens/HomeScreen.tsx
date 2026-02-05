import React, { useContext, useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Dimensions, StatusBar, SafeAreaView, ActivityIndicator, Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { getWeatherAdvice, WeatherAdvice } from '../utils/weatherRules';
import axios from 'axios';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useContext(AuthContext);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherAdvice, setWeatherAdvice] = useState<WeatherAdvice | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const PRIMARY_GREEN = '#2e7d32';
  const DARK_GREEN = '#1B5E20';

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      // Gọi API với timeout 5s để tránh treo loading
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Hanoi&units=metric&appid=c549f48ca1d3e62445770acaa7a8aed9&lang=vi`,
        { timeout: 5000 }
      );
      
      if (response.data && response.data.main) {
        const { temp, humidity } = response.data.main;
        const condition = response.data.weather[0]?.main;
        setWeatherData(response.data);
        setWeatherAdvice(getWeatherAdvice(temp, humidity, condition));
      } else {
        throw new Error("Dữ liệu không hợp lệ");
      }
    } catch (error: any) {
      console.log("Weather API Fetch Error:", error.message);
      // KHÔNG dùng số ảo nữa, để người dùng biết là đang lỗi
      setWeatherData(null);
      setWeatherAdvice({
        status: "CHƯA CẬP NHẬT",
        advice: "Không lấy được dữ liệu thời tiết. Bà con vui lòng kiểm tra kết nối mạng hoặc thử lại sau.",
        color: "#78909C",
        icon: "cloud-off-outline"
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Giám sát đàn',
      subtitle: 'Phát hiện gà ốm AI',
      icon: 'radar',
      color: '#2e7d32',
      bg: '#E8F5E9',
      screen: 'Detect'
    },
    {
      title: 'Chẩn đoán phân',
      subtitle: 'Chẩn đoán bệnh qua mẫu phân',
      icon: 'microscope',
      color: '#388E3C',
      bg: '#F1F8E9',
      screen: 'Classify'
    },
    {
      title: 'Trợ lý ảo AI',
      subtitle: 'Tư vấn chuyên gia',
      icon: 'robot-confused-outline',
      color: '#f57c00', // Accent from Web Admin
      bg: '#FFF3E0',
      screen: 'Chat'
    },
    {
      title: 'Cẩm nang',
      subtitle: 'Kỹ thuật chăn nuôi',
      icon: 'book-open-page-variant',
      color: '#689F38',
      bg: '#F9FBE7',
      screen: 'Knowledge'
    },
    {
      title: 'Nhật ký',
      subtitle: 'Lịch sử theo dõi',
      icon: 'history',
      color: '#455A64',
      bg: '#ECEFF1',
      screen: 'History'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.username}>{user?.full_name || 'Người chăn nuôi'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Farm Status Card - DYNAMIC WEATHER ALERT */}
        <View style={styles.statusCard}>
          {weatherLoading ? (
            <View style={{flex: 1, height: 60, justifyContent: 'center'}}>
              <ActivityIndicator color={PRIMARY_GREEN} />
            </View>
          ) : (
            <>
              <View style={styles.statusInfo}>
                <View style={[styles.iconCircle, { backgroundColor: weatherAdvice?.color + '20' }]}>
                  <Icon name={weatherAdvice?.icon || 'home-modern'} size={28} color={weatherAdvice?.color || PRIMARY_GREEN} />
                </View>
                <View style={{marginLeft: 12, flex: 1}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4}}>
                    <Text style={styles.statusTitle}>{weatherAdvice?.status}</Text>
                    {weatherData && (
                      <View style={styles.tempBadge}>
                        <Text style={styles.tempText}>{Math.round(weatherData.main.temp)}°C</Text>
                      </View>
                    )}
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name="water-percent" size={14} color="#546E7A" />
                    <Text style={styles.weatherDetail}>
                       {weatherData ? `${weatherData.main.humidity}% ẩm • ${weatherData.weather[0]?.description}` : '-- % ẩm'}
                    </Text>
                  </View>
                  <Text style={styles.statusSub} numberOfLines={2}>
                    {weatherAdvice?.advice}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={fetchWeather} style={{alignItems: 'flex-end'}}>
                 <View style={styles.cityBadge}>
                    <Icon name="map-marker" size={10} color="#90A4AE" />
                    <Text style={styles.cityName}>{weatherData?.name || 'Hà Nội'}</Text>
                 </View>
                 <Icon name="refresh" size={18} color="#B0BEC5" style={{marginTop: 8}} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Body Section */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tính năng thông minh</Text>
          <Icon name="star-four-points" size={18} color={PRIMARY_GREEN} />
        </View>
        
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.card, { backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Icon name={item.icon} size={26} color={item.color} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: DARK_GREEN }]}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  header: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {width: 0, height: 10}
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  username: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
  logoutBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14 },

  statusCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 20, padding: 16, justifyContent: 'space-between', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  statusTitle: { color: '#263238', fontSize: 14, fontWeight: 'bold' },
  tempBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  tempText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
  cityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F7F9', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6,
  },
  cityName: { color: '#90A4AE', fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  weatherDetail: { color: '#546E7A', fontSize: 12, marginLeft: 4, fontWeight: '700' },
  statusSub: { color: '#78909C', fontSize: 12, marginTop: 4, lineHeight: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2e7d32', marginRight: 6 },
  badgeText: { color: '#2e7d32', fontSize: 10, fontWeight: '900' },

  body: { paddingHorizontal: 24, paddingTop: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#263238', letterSpacing: -0.5 },
  
  grid: { gap: 15 },
  card: {
    width: '100%',
    padding: 16, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    backgroundColor: '#fff',
  },
  iconBox: {
    width: 54, height: 54, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#78909C' }
});

export default HomeScreen;
