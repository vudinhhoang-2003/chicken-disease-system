import React, { useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Dimensions, StatusBar, SafeAreaView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useContext(AuthContext);

  const PRIMARY_GREEN = '#2e7d32';
  const DARK_GREEN = '#1B5E20';

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
        
        {/* Farm Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <View style={styles.iconCircle}>
              <Icon name="home-modern" size={28} color={PRIMARY_GREEN} />
            </View>
            <View style={{marginLeft: 12}}>
              <Text style={styles.statusTitle}>Sức khỏe đàn gà</Text>
              <Text style={styles.statusSub}>Đàn gà đang phát triển tốt</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>KHỎE MẠNH</Text>
          </View>
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
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  statusTitle: { color: '#263238', fontSize: 15, fontWeight: 'bold' },
  statusSub: { color: '#90A4AE', fontSize: 12, marginTop: 2 },
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
