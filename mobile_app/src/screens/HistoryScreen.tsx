import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const { width, height } = Dimensions.get('window');

const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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
    const date = new Date(item.created_at).toLocaleDateString('vi-VN');
    const time = new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const imageUrl = `http://localhost:8000${item.image_url}`;

    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedItem(item)} activeOpacity={0.8}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'diagnosis' ? '#43a047' : '#1e88e5' }]}>
              <Text style={styles.typeText}>{item.type === 'diagnosis' ? 'PHÂN' : 'ĐÀN GÀ'}</Text>
            </View>
            <Text style={styles.dateText}>{date} {time}</Text>
          </View>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.result}</Text>
          <View style={styles.statusRow}>
            <Icon name={isSick ? "alert-circle" : "check-circle"} size={14} color={isSick ? "#e53935" : "#43a047"} />
            <Text style={[styles.statusText, { color: isSick ? "#e53935" : "#43a047" }]}>{isSick ? 'Phát hiện bất thường' : 'Bình thường'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetail = () => {
    if (!selectedItem) return null;
    const isSick = selectedItem.status === 'Sick';
    const imageUrl = `http://localhost:8000${selectedItem.image_url}`;

    return (
      <Modal visible={!!selectedItem} animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { backgroundColor: isSick ? '#c62828' : '#2e7d32' }]}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderText}>CHI TIẾT BÁO CÁO</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalScroll}>
            <Image source={{ uri: imageUrl }} style={styles.detailImage} resizeMode="contain" />
            
            <View style={styles.detailContent}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailDiseaseName}>{selectedItem.result}</Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: isSick ? '#FFEBEE' : '#E8F5E9' }]}>
                  <Text style={[styles.detailStatusText, { color: isSick ? '#C62828' : '#2E7D32' }]}>
                    {isSick ? 'CÓ BẤT THƯỜNG' : 'KHỎE MẠNH'}
                  </Text>
                </View>
              </View>

              {selectedItem.type === 'diagnosis' && selectedItem.disease_detail && (
                <View style={styles.medicalBox}>
                  <View style={styles.boxHeader}>
                    <Icon name="clipboard-pulse" size={20} color="#2e7d32" />
                    <Text style={styles.boxTitle}>PHÁC ĐỒ ĐIỀU TRỊ</Text>
                  </View>
                  <View style={styles.boxBody}>
                    <Text style={styles.sectionLabel}>Triệu chứng nhận diện:</Text>
                    <Text style={styles.sectionValue}>{selectedItem.disease_detail.symptoms}</Text>
                    
                    <View style={styles.divider} />
                    
                    {selectedItem.disease_detail.treatment_steps?.map((step: any) => (
                      <View key={step.id} style={styles.stepItem}>
                        <Text style={styles.stepName}>Bước {step.step_order}: {step.description}</Text>
                        {step.medicines?.map((med: any) => (
                          <Text key={med.id} style={styles.medName}>💊 {med.name} - {med.dosage}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedItem.type === 'detection' && selectedItem.stats && (
                <View style={styles.medicalBox}>
                  <View style={[styles.boxHeader, { backgroundColor: '#1e88e5' }]}>
                    <Icon name="chart-box" size={20} color="#fff" />
                    <Text style={[styles.boxTitle, { color: '#fff' }]}>THỐNG KÊ GIÁM SÁT</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statCell}><Text style={styles.statNum}>{selectedItem.stats.total}</Text><Text style={styles.statLab}>Tổng gà</Text></View>
                    <View style={styles.statCell}><Text style={[styles.statNum, {color: '#43a047'}]}>{selectedItem.stats.healthy}</Text><Text style={styles.statLab}>Khỏe</Text></View>
                    <View style={styles.statCell}><Text style={[styles.statNum, {color: '#e53935'}]}>{selectedItem.stats.sick}</Text><Text style={styles.statLab}>Ủ rũ</Text></View>
                  </View>
                </View>
              )}
              
              <Text style={styles.timestamp}>Thời gian ghi nhận: {new Date(selectedItem.created_at).toLocaleString('vi-VN')}</Text>
            </View>
            <View style={{height: 50}} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2e7d32" size="large" /><Text style={styles.loadingText}>Đang tải nhật ký...</Text></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />}
        ListEmptyComponent={<View style={styles.emptyContainer}><Icon name="clipboard-text-outline" size={80} color="#cfd8dc" /><Text style={styles.emptyTitle}>Chưa có dữ liệu</Text></View>}
      />
      {renderDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  listContent: { padding: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 3 },
  thumbnail: { width: 90, height: 90 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  dateText: { fontSize: 10, color: '#999' },
  resultTitle: { fontSize: 15, fontWeight: 'bold', color: '#263238' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 12, marginLeft: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  modalHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  modalScroll: { flex: 1 },
  detailImage: { width: width, height: 300, backgroundColor: '#000' },
  detailContent: { padding: 20 },
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailDiseaseName: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1 },
  detailStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailStatusText: { fontSize: 12, fontWeight: 'bold' },
  medicalBox: { borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
  boxHeader: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f1f8e9' },
  boxTitle: { fontWeight: 'bold', fontSize: 14, color: '#2e7d32' },
  boxBody: { padding: 15 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5 },
  sectionValue: { fontSize: 15, color: '#333', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  stepItem: { marginBottom: 15 },
  stepName: { fontWeight: 'bold', color: '#2e7d32', marginBottom: 5 },
  medName: { color: '#c62828', marginLeft: 15, fontSize: 14 },
  statsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  statCell: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLab: { fontSize: 12, color: '#999' },
  timestamp: { fontSize: 12, color: '#bbb', textAlign: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ccc', marginTop: 15 },
});

export default HistoryScreen;
