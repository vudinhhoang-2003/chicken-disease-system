import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Modal, ScrollView, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';

const KnowledgeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const PRIMARY_GREEN = '#2e7d32';

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await client.get('/users/knowledge');
      setKnowledgeList(response.data);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = knowledgeList.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        <View style={[styles.categoryTag, {backgroundColor: '#E8F5E9'}]}>
          <Text style={[styles.categoryText, {color: PRIMARY_GREEN}]}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summary} numberOfLines={2}>{item.content}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={[styles.readMore, {color: PRIMARY_GREEN}]}>Xem chi tiết</Text>
          <Icon name="chevron-right" size={18} color={PRIMARY_GREEN} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Kiến Thức" 
        subtitle="Cẩm nang chăn nuôi chuyên gia" 
      />

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color="#90A4AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm kỹ thuật..."
            placeholderTextColor="#B0BEC5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={PRIMARY_GREEN} size="large" />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="book-open-blank-variant" size={60} color="#CFD8DC" />
              <Text style={styles.emptyText}>Chưa có kiến thức nào</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#37474F" />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitleText}>Nội dung chi tiết</Text>
            </View>
            <View style={{width: 40}} />
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                <View style={[styles.modalCategoryTag, {backgroundColor: PRIMARY_GREEN}]}>
                  <Text style={styles.modalCategoryText}>{selectedItem.category}</Text>
                </View>
                
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.modalBody}>{selectedItem.content}</Text>
                
                {selectedItem.source && (
                  <View style={styles.sourceBox}>
                    <Icon name="information-outline" size={18} color={PRIMARY_GREEN} />
                    <Text style={styles.sourceText}>Nguồn: {selectedItem.source}</Text>
                  </View>
                )}
              </View>
              <View style={{ height: 80 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 16, height: 52,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#37474F' },
  listContent: { padding: 20, paddingTop: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  categoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#263238', marginBottom: 8, lineHeight: 26 },
  summary: { fontSize: 14, color: '#78909C', lineHeight: 22, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readMore: { fontWeight: '900', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#B0BEC5', marginTop: 15, fontSize: 16, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  headerTitleText: { fontSize: 16, fontWeight: 'bold', color: '#263238' },
  closeBtn: { padding: 8, backgroundColor: '#F5F7FA', borderRadius: 12 },
  modalScroll: { flex: 1 },
  modalContent: { paddingHorizontal: 24, paddingTop: 24 },
  modalCategoryTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  modalCategoryText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#263238', lineHeight: 34, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#F1F8E9', marginBottom: 20 },
  modalBody: { fontSize: 16, color: '#455A64', lineHeight: 28, textAlign: 'justify' },
  sourceBox: { flexDirection: 'row', gap: 10, marginTop: 40, padding: 16, backgroundColor: '#F9FBE7', borderRadius: 12, alignItems: 'center' },
  sourceText: { flex: 1, fontStyle: 'italic', color: '#689F38', fontSize: 13 },
});

export default KnowledgeScreen;