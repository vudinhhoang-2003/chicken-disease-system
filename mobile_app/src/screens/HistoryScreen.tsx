import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, Dimensions, StatusBar, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const PRIMARY_GREEN = '#2e7d32';

  const fetchHistory = async () => {
    try {
      const response = await client.get('/users/me/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSick = item.status === 'Sick';
    const dateObj = new Date(item.created_at);
    const date = dateObj.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
    const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const imageUrl = `http://localhost:8000${item.image_url}`;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => setSelectedItem(item)} 
        activeOpacity={0.9}
      >
        <View style={styles.dateColumn}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.timeText}>{time}</Text>
        </View>
        
        <View style={styles.dividerLine} />
        
        <View style={styles.cardContent}>
          <View style={styles.contentHeader}>
            <View style={[styles.tag, { backgroundColor: item.type === 'diagnosis' ? '#E8F5E9' : '#F1F8E9' }]}>
              <Text style={[styles.tagText, { color: PRIMARY_GREEN }]}>
                {item.type === 'diagnosis' ? 'CHẨN ĐOÁN' : 'GIÁM SÁT'}
              </Text>
            </View>
            {isSick && <Icon name="alert-decagram" size={16} color="#FF5252" />}
          </View>
          
          <Text style={styles.resultText} numberOfLines={1}>{item.result}</Text>
          <Text style={[styles.statusText, { color: isSick ? '#FF5252' : '#2e7d32' }]}>
            {isSick ? 'Cần chú ý' : 'Bình thường'}
          </Text>
        </View>

        <Image source={{ uri: imageUrl }} style={styles.thumb} />
      </TouchableOpacity>
    );
  };

  const renderDetail = () => {
    if (!selectedItem) return null;
    const isSick = selectedItem.status === 'Sick';
    const imageUrl = `http://localhost:8000${selectedItem.image_url}`;

    return (
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#37474F" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi tiết báo cáo</Text>
            <View style={{width: 40}} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: imageUrl }} style={styles.detailImage} resizeMode="contain" />
            
            <View style={styles.detailBody}>
              <View style={styles.resultBanner}>
                <View>
                  <Text style={styles.bannerLabel}>KẾT QUẢ AI</Text>
                  <Text style={styles.bannerValue}>{selectedItem.result}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isSick ? '#FFEBEE' : '#E8F5E9' }]}>
                  <Text style={[styles.statusBadgeText, { color: isSick ? '#C62828' : '#2E7D32' }]}>
                    {isSick ? 'NGUY CƠ' : 'AN TOÀN'}
                  </Text>
                </View>
              </View>

              {selectedItem.type === 'diagnosis' && selectedItem.disease_detail && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: PRIMARY_GREEN}]}>Thông tin bệnh lý</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Triệu chứng lâm sàng:</Text>
                    <Text style={styles.infoText}>{selectedItem.disease_detail.symptoms}</Text>
                  </View>
                  
                  <Text style={[styles.sectionTitle, {marginTop: 25, color: PRIMARY_GREEN}]}>Phác đồ gợi ý</Text>
                  {selectedItem.disease_detail.treatment_steps?.map((step: any) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={[styles.stepNumBox, {backgroundColor: PRIMARY_GREEN}]}>
                        <Text style={styles.stepNum}>{step.step_order}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.stepDesc}>{step.description}</Text>
                        <View style={styles.medsRow}>
                          {step.medicines?.map((med: any) => (
                            <View key={med.id} style={styles.medItem}>
                              <Icon name="pill" size={12} color={PRIMARY_GREEN} />
                              <Text style={styles.medTag}>{med.name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {selectedItem.type === 'detection' && selectedItem.stats && (
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, {backgroundColor: '#F5F7FA'}]}>
                    <Text style={styles.statVal}>{selectedItem.stats.total}</Text>
                    <Text style={styles.statKey}>Tổng đàn</Text>
                  </View>
                  <View style={[styles.statBox, {backgroundColor: '#E8F5E9'}]}>
                    <Text style={[styles.statVal, {color: '#2e7d32'}]}>{selectedItem.stats.healthy}</Text>
                    <Text style={styles.statKey}>Khỏe mạnh</Text>
                  </View>
                  <View style={[styles.statBox, {backgroundColor: '#FFEBEE'}]}>
                    <Text style={[styles.statVal, {color: '#FF5252'}]}>{selectedItem.stats.sick}</Text>
                    <Text style={styles.statKey}>Ủ rũ</Text>
                  </View>
                </View>
              )}
              
              <Text style={styles.timestamp}>
                Ghi nhận: {new Date(selectedItem.created_at).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={{height: 80}} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Nhật Ký" subtitle="Lịch sử chẩn đoán đàn gà" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={PRIMARY_GREEN} size="large" />
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="history" size={60} color="#CFD8DC" />
              <Text style={styles.emptyText}>Chưa có lịch sử nào</Text>
            </View>
          }
        />
      )}
      {renderDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { padding: 20 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
    padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05
  },
  dateColumn: { alignItems: 'center', justifyContent: 'center', width: 50 },
  dateText: { fontSize: 16, fontWeight: '900', color: '#263238' },
  timeText: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  dividerLine: { width: 1, backgroundColor: '#E8F5E9', marginHorizontal: 15 },
  cardContent: { flex: 1, justifyContent: 'center' },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '900' },
  resultText: { fontSize: 16, fontWeight: 'bold', color: '#37474F', marginBottom: 2 },
  statusText: { fontSize: 13, fontWeight: '600' },
  thumb: { width: 64, height: 64, borderRadius: 14, marginLeft: 10, backgroundColor: '#F5F5F5' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#B0BEC5', marginTop: 15, fontSize: 16, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#263238' },
  closeBtn: { padding: 8, backgroundColor: '#F5F7FA', borderRadius: 12 },
  modalScroll: { flex: 1 },
  detailImage: { width: width, height: 280, backgroundColor: '#FAFAFA' },
  detailBody: { paddingHorizontal: 24, paddingTop: 24 },
  resultBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  bannerLabel: { fontSize: 11, fontWeight: 'bold', color: '#90A4AE', letterSpacing: 1 },
  bannerValue: { fontSize: 24, fontWeight: '900', color: '#263238' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontWeight: '900', fontSize: 11 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  infoBox: { backgroundColor: '#F1F8E9', padding: 16, borderRadius: 18 },
  infoLabel: { fontWeight: 'bold', color: '#546E7A', marginBottom: 4, fontSize: 13 },
  infoText: { color: '#37474F', lineHeight: 24, fontSize: 15 },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepNumBox: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 2 },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepDesc: { fontSize: 15, color: '#455A64', lineHeight: 22, marginBottom: 8, fontWeight: '600' },
  medsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  medItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  medTag: { fontSize: 13, color: '#2e7d32', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#263238' },
  statKey: { fontSize: 11, color: '#90A4AE', fontWeight: 'bold', marginTop: 4 },
  timestamp: { textAlign: 'center', color: '#B0BEC5', fontSize: 12, marginTop: 20 }
});

export default HistoryScreen;
