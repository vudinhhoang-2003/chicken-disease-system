import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const KnowledgeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#ccc" />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary} numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm kiến thức..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#2e7d32" size="large" />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="book-open-blank-variant" size={60} color="#ddd" />
              <Text style={styles.emptyText}>Chưa có dữ liệu kiến thức</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderText}>Chi tiết kiến thức</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalCategoryBadge}>
                <Text style={styles.modalCategoryText}>{selectedItem.category}</Text>
              </View>
              <Text style={styles.modalTitle}>{selectedItem.title}</Text>
              <View style={styles.divider} />
              <Text style={styles.modalBody}>{selectedItem.content}</Text>
              
              {selectedItem.source && (
                <View style={styles.sourceBox}>
                  <Text style={styles.sourceText}>Nguồn: {selectedItem.source}</Text>
                </View>
              )}
              <View style={{ height: 50 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { padding: 15, paddingTop: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  summary: { fontSize: 14, color: '#666', lineHeight: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2e7d32', // Web Admin Green
  },
  modalHeaderText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalContent: { padding: 20 },
  modalCategoryBadge: {
    backgroundColor: '#2e7d32',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 15,
  },
  modalCategoryText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a237e', lineHeight: 32 },
  divider: { height: 2, backgroundColor: '#f0f0f0', marginVertical: 20 },
  modalBody: { fontSize: 16, color: '#444', lineHeight: 26, textAlign: 'justify' },
  sourceBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
  },
  sourceText: { fontStyle: 'italic', color: '#777', fontSize: 13 },
});

export default KnowledgeScreen;