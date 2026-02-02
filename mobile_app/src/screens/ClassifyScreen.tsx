import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Platform
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const { width } = Dimensions.get('window');

const ClassifyScreen = ({ navigation }: any) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSelectImage = (type: 'camera' | 'library') => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    const callback = (response: any) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Lỗi', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setImageFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'photo.jpg',
        });
        setResult(null);
      }
    };

    if (type === 'camera') launchCamera(options, callback);
    else launchImageLibrary(options, callback);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      });

      const response = await client.post('/detect/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể phân tích ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const isHealthy = result.is_healthy;
    const diseaseName = result.disease_detail?.name_vi || result.disease;
    const confidence = (result.confidence * 100).toFixed(1);

    return (
      <View style={styles.reportContainer}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>KẾT QUẢ PHÂN TÍCH</Text>
          <View style={[styles.statusBadge, { backgroundColor: isHealthy ? '#e8f5e9' : '#ffebee' }]}>
            <Text style={[styles.statusText, { color: isHealthy ? '#2e7d32' : '#c62828' }]}>
              {isHealthy ? 'KHỎE MẠNH' : 'CÓ BỆNH'}
            </Text>
          </View>
        </View>

        <View style={styles.diseaseInfo}>
          <Text style={styles.diseaseName}>{diseaseName}</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Độ chính xác AI:</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${confidence}%`, backgroundColor: isHealthy ? '#4caf50' : '#ff9800' }]} />
            </View>
            <Text style={styles.confidenceValue}>{confidence}%</Text>
          </View>
        </View>

        {result.disease_detail && (
          <View style={styles.treatmentSection}>
            <View style={styles.sectionTitleRow}>
              <Icon name="doctor" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>Phác đồ điều trị</Text>
            </View>
            
            {result.disease_detail.treatment_steps?.map((step: any) => (
              <View key={step.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.stepHeader}>Bước {step.step_order}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                  {step.medicines?.map((med: any) => (
                     <View key={med.id} style={styles.medicineTag}>
                       <Icon name="pill" size={14} color="#d32f2f" />
                       <Text style={styles.medicineText}>{med.name} ({med.dosage})</Text>
                     </View>
                   ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Image Preview Area */}
        <View style={styles.previewContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="scan-helper" size={60} color="#cfd8dc" />
              <Text style={styles.placeholderText}>Chụp ảnh phân gà để chẩn đoán</Text>
            </View>
          )}
          
          {/* Action Buttons Overlay */}
          <View style={styles.overlayActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleSelectImage('camera')}>
              <Icon name="camera" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleSelectImage('library')}>
              <Icon name="image" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analyze Button */}
        {imageUri && !result && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Icon name="text-box-search-outline" size={24} color="#fff" />
                <Text style={styles.analyzeBtnText}>PHÂN TÍCH NGAY</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {renderResult()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { paddingBottom: 40 },
  
  previewContainer: {
    height: 350,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eceff1' },
  placeholderText: { marginTop: 15, color: '#90a4ae', fontSize: 16 },
  
  overlayActions: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 15,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginLeft: 10,
  },

  analyzeBtn: {
    backgroundColor: '#2e7d32',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },

  // Report Styles
  reportContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  reportTitle: { fontSize: 12, color: '#999', fontWeight: 'bold', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  diseaseInfo: { alignItems: 'center', marginBottom: 25 },
  diseaseName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  confidenceLabel: { fontSize: 12, color: '#666', width: 100 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  confidenceValue: { fontSize: 12, fontWeight: 'bold', color: '#333', width: 40, textAlign: 'right' },

  treatmentSection: { marginTop: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginLeft: 8 },
  
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2e7d32', marginTop: 5, marginRight: 15 },
  timelineContent: { flex: 1 },
  stepHeader: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  stepDesc: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 8 },
  medicineTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 5 },
  medicineText: { color: '#c62828', fontSize: 13, fontWeight: '500', marginLeft: 6 },
});

export default ClassifyScreen;
