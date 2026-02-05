import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Pressable, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Animated, Easing, StatusBar, Platform, TouchableOpacity
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const ClassifyScreen = ({ navigation }: any) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const PRIMARY_GREEN = '#2e7d32';
  const DARK_GREEN = '#1B5E20';
  
  // Animations
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (loading) startScanAnimation();
    else stopScanAnimation();
  }, [loading]);

  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideUpAnim, { toValue: 0, friction: 7, useNativeDriver: true })
      ]).start();
    }
  }, [result]);

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnim.stopAnimation();
    scanAnim.setValue(0);
  };

  const handleSelectImage = (source: 'camera' | 'library') => {
    const options = { mediaType: 'photo' as MediaType, quality: 0.9, maxWidth: 1200, maxHeight: 1200 };
    const callback = (response: any) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setImageFile({ uri: asset.uri, type: asset.type, name: asset.fileName || 'sample.jpg' });
        setResult(null);
        fadeAnim.setValue(0);
        slideUpAnim.setValue(100);
      }
    };
    if (source === 'camera') launchCamera(options, callback);
    else launchImageLibrary(options, callback);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', { uri: imageFile.uri, type: imageFile.type, name: imageFile.name });
      const response = await client.post('/detect/classify', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      setTimeout(() => {
        setResult(response.data);
        setLoading(false);
      }, 1000); 
      
    } catch (error: any) {
      Alert.alert('Lỗi chẩn đoán', 'Không thể kết nối với máy chủ AI.');
      setLoading(false);
    }
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300]
  });

  const isHealthy = result?.is_healthy;
  const statusColor = isHealthy ? '#2e7d32' : '#FF5252';

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Chẩn Đoán Bệnh" 
        subtitle="Chẩn đoán mẫu phân bằng AI"
        rightComponent={
          <View style={styles.headerIcon}>
            <Icon name="microscope" size={24} color={PRIMARY_GREEN} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={styles.scannerWrapper}>
          <View style={[styles.scanFrame, result && { borderColor: statusColor, borderWidth: 2 }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="medical-bag" size={50} color="#B0BEC5" />
                </View>
                <Text style={styles.emptyTitle}>Chưa có mẫu vật</Text>
                <Text style={styles.emptySub}>Vui lòng cung cấp ảnh chụp mẫu phân</Text>
              </View>
            )}

            {loading && (
              <Animated.View style={[styles.laser, { transform: [{ translateY: scanTranslateY }] }]} />
            )}

            {result && (
              <View style={[styles.resultTag, { backgroundColor: statusColor }]}>
                <Icon name={isHealthy ? "check-circle" : "alert-decagram"} size={16} color="#fff" />
                <Text style={styles.resultTagText}>
                  {isHealthy ? "BÌNH THƯỜNG" : "PHÁT HIỆN BỆNH"}
                </Text>
              </View>
            )}
          </View>

          {!loading && !result && (
            <View style={styles.controls}>
              {imageUri ? (
                <View style={styles.actionRow}>
                  <Pressable style={styles.btnSub} onPress={() => {setImageUri(null); setImageFile(null);}}>
                    <Icon name="close" size={24} color="#546E7A" />
                  </Pressable>
                  <Pressable 
                    style={({pressed}) => [styles.btnMain, pressed && {transform: [{scale: 0.96}]}]} 
                    onPress={handleAnalyze}
                  >
                    <Icon name="check-decagram" size={24} color="#fff" />
                    <Text style={styles.btnMainText}>TIẾN HÀNH CHẨN ĐOÁN</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pickers}>
                  <Pressable style={styles.pickerBtn} onPress={() => handleSelectImage('library')}>
                    <View style={[styles.pickerIcon, {backgroundColor: '#E8F5E9'}]}>
                      <Icon name="image-outline" size={28} color={PRIMARY_GREEN} />
                    </View>
                    <Text style={styles.pickerLabel}>Thư viện</Text>
                  </Pressable>
                  <Pressable style={styles.pickerBtn} onPress={() => handleSelectImage('camera')}>
                    <View style={[styles.pickerIcon, {backgroundColor: '#E8F5E9'}]}>
                      <Icon name="camera-iris" size={32} color={PRIMARY_GREEN} />
                    </View>
                    <Text style={styles.pickerLabel}>Chụp mẫu</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {result && (
          <Animated.View style={[styles.reportContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <View style={styles.diagnosisCard}>
              <Text style={styles.cardHeader}>KẾT QUẢ CHẨN ĐOÁN</Text>
              <View style={styles.diagnosisRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.diseaseName}>{result.disease_detail?.name_vi || result.disease}</Text>
                  <Text style={styles.diseaseEng}>{result.disease_detail?.name_en || ""}</Text>
                </View>
                <View style={styles.confidenceCircle}>
                  <Text style={[styles.confValue, {color: statusColor}]}>{(result.confidence * 100).toFixed(0)}%</Text>
                  <Text style={styles.confLabel}>Chính xác</Text>
                </View>
              </View>
            </View>

            {!isHealthy && result.disease_detail && (
              <>
                <View style={styles.infoGroup}>
                  <View style={styles.infoHeader}>
                    <Icon name="alert-circle-outline" size={20} color="#FF7043" />
                    <Text style={[styles.infoTitle, {color: DARK_GREEN}]}>TRIỆU CHỨNG NHẬN DIỆN</Text>
                  </View>
                  <Text style={styles.infoBody}>{result.disease_detail.symptoms}</Text>
                </View>

                <View style={styles.treatmentCard}>
                  <View style={[styles.treatmentHeader, {backgroundColor: PRIMARY_GREEN}]}>
                    <Icon name="medical-bag" size={22} color="#fff" />
                    <Text style={styles.treatmentTitle}>PHÁC ĐỒ ĐIỀU TRỊ</Text>
                  </View>
                  <View style={styles.treatmentBody}>
                    {result.disease_detail.treatment_steps?.map((step: any, index: number) => (
                      <View key={step.id} style={styles.stepItem}>
                        <View style={styles.stepLeft}>
                          <View style={[styles.stepCircle, {backgroundColor: PRIMARY_GREEN}]}>
                            <Text style={styles.stepNum}>{step.step_order}</Text>
                          </View>
                          {index < result.disease_detail.treatment_steps.length - 1 && <View style={styles.stepLine} />}
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepDesc}>{step.description}</Text>
                          <View style={styles.medsContainer}>
                            {step.medicines?.map((med: any) => (
                              <View key={med.id} style={styles.pill}>
                                <Icon name="pill" size={14} color={PRIMARY_GREEN} />
                                <Text style={[styles.pillText, {color: PRIMARY_GREEN}]}>{med.name} • {med.dosage}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.chatBtn, {backgroundColor: PRIMARY_GREEN}]}
                  onPress={() => navigation.navigate('Chat', { 
                    initialMessage: `Tôi muốn hỏi thêm về bệnh ${result.disease_detail.name_vi}. Phác đồ trên cần lưu ý gì không?` 
                  })}
                >
                  <Icon name="chat-question-outline" size={24} color="#fff" />
                  <Text style={styles.chatBtnText}>HỎI Ý KIẾN CHUYÊN GIA AI</Text>
                </TouchableOpacity>
              </>
            )}

            {isHealthy && (
              <View style={styles.healthyCard}>
                <Icon name="check-decagram" size={60} color="#2e7d32" />
                <Text style={[styles.healthyTitle, {color: '#2e7d32'}]}>Kết quả an toàn</Text>
                <Text style={styles.healthyDesc}>
                  AI không tìm thấy dấu hiệu bệnh lý trong mẫu phân này. Hãy tiếp tục theo dõi sức khỏe tổng quát của đàn gà.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.retryBtn} onPress={() => {setImageUri(null); setResult(null);}}>
              <Text style={styles.retryText}>KIỂM TRA MẪU KHÁC</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  scannerWrapper: { alignItems: 'center', marginHorizontal: 20, marginTop: 20 },
  scanFrame: { width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 32, backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  image: { width: '100%', height: '100%' },
  emptyState: { alignItems: 'center' },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#263238' },
  emptySub: { fontSize: 13, color: '#90A4AE', marginTop: 5 },
  laser: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#00E676', shadowColor: '#00E676', shadowOpacity: 1, shadowRadius: 10 },
  resultTag: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, elevation: 4 },
  resultTagText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  controls: { marginTop: 25, width: '100%' },
  pickers: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
  pickerBtn: { alignItems: 'center' },
  pickerIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4 },
  pickerLabel: { fontSize: 14, fontWeight: '700', color: '#455A64' },
  actionRow: { flexDirection: 'row', gap: 15, justifyContent: 'center', width: '100%', paddingHorizontal: 20 },
  btnSub: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  btnMain: { flex: 1, height: 56, backgroundColor: '#2e7d32', borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 6 },
  btnMainText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  reportContainer: { paddingHorizontal: 20, marginTop: 25 },
  diagnosisCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, borderWidth: 1, borderColor: '#E8F5E9' },
  cardHeader: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 12, letterSpacing: 1 },
  diagnosisRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diseaseName: { fontSize: 24, fontWeight: '900', color: '#263238' },
  diseaseEng: { fontSize: 14, color: '#78909C', fontStyle: 'italic', marginTop: 2 },
  confidenceCircle: { alignItems: 'center' },
  confValue: { fontSize: 22, fontWeight: '900' },
  confLabel: { fontSize: 10, color: '#90A4AE', fontWeight: '700' },
  infoGroup: { marginBottom: 20 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  infoBody: { fontSize: 15, color: '#455A64', lineHeight: 22, backgroundColor: '#fff', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F1F8E9' },
  treatmentCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, marginBottom: 25 },
  treatmentHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  treatmentTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  treatmentBody: { padding: 20 },
  stepItem: { flexDirection: 'row' },
  stepLeft: { width: 40, alignItems: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E8F5E9', marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: 30 },
  stepDesc: { fontSize: 15, color: '#263238', marginBottom: 10, fontWeight: '600', lineHeight: 22 },
  medsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8E9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  pillText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  chatBtn: { borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 6, shadowColor: '#2e7d32', shadowOpacity: 0.2, marginBottom: 20 },
  chatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  healthyCard: { backgroundColor: '#E8F5E9', padding: 35, borderRadius: 28, alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#C8E6C9' },
  healthyTitle: { fontSize: 22, fontWeight: '900', marginTop: 15, marginBottom: 10 },
  healthyDesc: { fontSize: 14, color: '#388E3C', textAlign: 'center', lineHeight: 22 },
  retryBtn: { padding: 15, alignItems: 'center' },
  retryText: { color: '#90A4AE', fontWeight: 'bold', letterSpacing: 1 }
});

export default ClassifyScreen;
