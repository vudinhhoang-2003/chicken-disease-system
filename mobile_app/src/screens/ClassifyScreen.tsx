import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Animated, Easing
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const { width, height } = Dimensions.get('window');

const ClassifyScreen = ({ navigation }: any) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Animation value
  const scanAnim = useRef(new Animated.Value(0)).current;

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnim.stopAnimation();
    scanAnim.setValue(0);
  };

  const handleSelectImage = (type: 'camera' | 'library') => {
    const options = { mediaType: 'photo' as MediaType, quality: 0.9, maxWidth: 1200, maxHeight: 1200 };
    const callback = (response: any) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setImageFile({ uri: asset.uri, type: asset.type, name: asset.fileName || 'photo.jpg' });
        setResult(null);
      }
    };
    if (type === 'camera') launchCamera(options, callback);
    else launchImageLibrary(options, callback);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    startScanAnimation();
    
    try {
      const formData = new FormData();
      formData.append('file', { uri: imageFile.uri, type: imageFile.type, name: imageFile.name });
      const response = await client.post('/detect/classify', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // Giả lập độ trễ 1 chút để hiệu ứng quét chạy cho đẹp
      setTimeout(() => {
        setResult(response.data);
        setLoading(false);
        stopScanAnimation();
      }, 1500);
      
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể phân tích ảnh.');
      setLoading(false);
      stopScanAnimation();
    }
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300] // Quét dọc theo chiều cao ảnh
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* 1. Khu vực ảnh (Hero Section) */}
        <View style={styles.heroContainer}>
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.image} />
                {loading && (
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
                )}
              </>
            ) : (
              <View style={styles.placeholder}>
                <Icon name="scan-helper" size={80} color="#CFD8DC" />
                <Text style={styles.placeholderTitle}>Chụp ảnh phân gà</Text>
                <Text style={styles.placeholderSub}>AI sẽ phân tích và chẩn đoán bệnh ngay lập tức</Text>
              </View>
            )}
            
            {/* Nút chụp ảnh nổi (Floating Actions) */}
            {!loading && (
              <View style={styles.floatingActions}>
                <TouchableOpacity style={styles.floatBtnSmall} onPress={() => handleSelectImage('library')}>
                  <Icon name="image-outline" size={24} color="#333" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.floatBtnLarge} onPress={() => handleSelectImage('camera')}>
                  <Icon name="camera" size={32} color="#fff" />
                </TouchableOpacity>

                {imageUri && (
                  <TouchableOpacity style={[styles.floatBtnSmall, {backgroundColor: '#2e7d32'}]} onPress={handleAnalyze}>
                    <Icon name="check" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 2. Khu vực Kết quả (Result Section) */}
        {result ? (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultLabel}>KẾT QUẢ CHẨN ĐOÁN</Text>
                <Text style={styles.diseaseName}>{result.disease_detail?.name_vi || result.disease}</Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: result.is_healthy ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={[styles.confidenceText, { color: result.is_healthy ? '#2E7D32' : '#C62828' }]}>
                  {(result.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            {result.disease_detail && (
              <View style={styles.treatmentBox}>
                <View style={styles.treatmentHeader}>
                  <Icon name="medical-bag" size={20} color="#fff" />
                  <Text style={styles.treatmentTitle}>PHÁC ĐỒ ĐIỀU TRỊ</Text>
                </View>
                
                <View style={styles.treatmentContent}>
                  {result.disease_detail.treatment_steps?.map((step: any, index: number) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={styles.stepIndicator}>
                        <View style={styles.stepDot} />
                        {index < result.disease_detail.treatment_steps.length - 1 && <View style={styles.stepLine} />}
                      </View>
                      <View style={styles.stepInfo}>
                        <Text style={styles.stepName}>Bước {step.step_order}</Text>
                        <Text style={styles.stepDesc}>{step.description}</Text>
                        {step.medicines?.map((med: any) => (
                          <View key={med.id} style={styles.pillTag}>
                            <Icon name="pill" size={14} color="#1565C0" />
                            <Text style={styles.pillText}>{med.name} • {med.dosage}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Hướng dẫn chụp ảnh</Text>
            <View style={styles.guideItem}>
              <Icon name="check-circle-outline" size={20} color="#2e7d32" />
              <Text style={styles.guideText}>Giữ camera ổn định, tránh rung lắc</Text>
            </View>
            <View style={styles.guideItem}>
              <Icon name="check-circle-outline" size={20} color="#2e7d32" />
              <Text style={styles.guideText}>Đảm bảo đủ ánh sáng, rõ nét</Text>
            </View>
            <View style={styles.guideItem}>
              <Icon name="check-circle-outline" size={20} color="#2e7d32" />
              <Text style={styles.guideText}>Chụp cận cảnh mẫu phân hoặc gà</Text>
            </View>
          </View>
        )}

        <View style={{height: 100}} /> 
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1 },
  
  // Hero Image
  heroContainer: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  imageWrapper: {
    width: width - 40,
    height: width - 40,
    borderRadius: 30,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3F4' },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#546E7A', marginTop: 15 },
  placeholderSub: { fontSize: 13, color: '#90A4AE', textAlign: 'center', marginTop: 5, maxWidth: '70%' },
  
  scanLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: '#00E676',
    shadowColor: '#00E676', shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 10, elevation: 5
  },

  // Floating Actions
  floatingActions: {
    position: 'absolute', bottom: 25, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20
  },
  floatBtnSmall: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', elevation: 5
  },
  floatBtnLarge: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)'
  },

  // Result Section
  resultContainer: { paddingHorizontal: 25, marginTop: 10 },
  resultHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 
  },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', letterSpacing: 1, marginBottom: 5 },
  diseaseName: { fontSize: 26, fontWeight: '900', color: '#263238', maxWidth: '80%' },
  confidenceBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center'
  },
  confidenceText: { fontSize: 14, fontWeight: 'bold' },

  // Treatment Box
  treatmentBox: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  treatmentHeader: {
    backgroundColor: '#2E7D32', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10
  },
  treatmentTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  treatmentContent: { padding: 20 },
  
  stepRow: { flexDirection: 'row', marginBottom: 0 },
  stepIndicator: { width: 30, alignItems: 'center' },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2E7D32', marginTop: 5 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginVertical: 5 },
  stepInfo: { flex: 1, paddingBottom: 25 },
  stepName: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  stepDesc: { fontSize: 15, color: '#455A64', lineHeight: 22, marginBottom: 8 },
  pillTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 5
  },
  pillText: { fontSize: 13, color: '#1565C0', fontWeight: '600', marginLeft: 6 },

  // Guide
  guideContainer: { padding: 30, opacity: 0.7 },
  guideTitle: { fontSize: 16, fontWeight: 'bold', color: '#546E7A', marginBottom: 15 },
  guideItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  guideText: { fontSize: 14, color: '#607D8B' }
});

export default ClassifyScreen;