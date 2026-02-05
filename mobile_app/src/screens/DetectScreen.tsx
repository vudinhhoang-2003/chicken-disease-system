import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Pressable, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Animated, Easing, Platform, StatusBar, TouchableOpacity
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const DetectScreen = ({ navigation }: any) => {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<any>(null);
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
        Animated.spring(slideUpAnim, { toValue: 0, friction: 6, useNativeDriver: true })
      ]).start();
    }
  }, [result]);

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnim.stopAnimation();
    scanAnim.setValue(0);
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300]
  });

  const handleSelectMedia = (source: 'camera' | 'library') => {
    const options = { mediaType: 'photo' as MediaType, quality: 0.9, maxWidth: 1280, maxHeight: 1280 };
    const callback = (response: any) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        setMediaUri(asset.uri);
        setMediaFile({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'input.jpg' });
        setResult(null);
        fadeAnim.setValue(0);
        slideUpAnim.setValue(100);
      }
    };
    if (source === 'camera') launchCamera(options, callback);
    else launchImageLibrary(options, callback);
  };

  const handleAnalyze = async () => {
    if (!mediaFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: mediaFile.uri, type: mediaFile.type, name: mediaFile.name });
      const response = await client.post('/detect/detect', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 
      });
      setTimeout(() => {
        setResult(response.data);
        setLoading(false);
      }, 800);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể phân tích dữ liệu.');
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setMediaUri(null);
    setMediaFile(null);
  };

  const getStatusColor = () => {
    if (!result) return '#B0BEC5';
    if (result.sick_count > 0) return '#FF5252'; 
    return '#2e7d32'; 
  };

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Giám Sát Đàn" 
        subtitle="AI nhận diện thời gian thực"
        rightComponent={
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: loading ? PRIMARY_GREEN : '#00E676' }]} />
            <Text style={styles.statusText}>{loading ? 'ĐANG QUÉT' : 'SẴN SÀNG'}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={styles.scannerContainer}>
          <View style={[styles.scannerFrame, result && { borderColor: getStatusColor(), borderWidth: 2 }]}>
            {result ? (
              <Image source={{ uri: `data:image/jpeg;base64,${result.image_base64}` }} style={styles.image} resizeMode="contain" />
            ) : mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderState}>
                <View style={styles.iconCircle}>
                  <Icon name="radar" size={60} color="#B0BEC5" />
                </View>
                <Text style={styles.placeholderText}>Chưa có hình ảnh</Text>
                <Text style={styles.placeholderHint}>Hệ thống đang chờ dữ liệu quan sát</Text>
              </View>
            )}

            {loading && (
              <Animated.View style={[styles.laserLine, { transform: [{ translateY: scanTranslateY }] }]} />
            )}
            
            {result && (
              <View style={[styles.resultLabelTag, { backgroundColor: getStatusColor() }]}>
                <Icon name={result.sick_count > 0 ? "alert-decagram" : "check-decagram"} size={16} color="#fff" />
                <Text style={styles.resultLabelText}>
                  {result.sick_count > 0 ? "PHÁT HIỆN BẤT THƯỜNG" : "TRẠNG THÁI TỐT"}
                </Text>
              </View>
            )}
          </View>

          {!loading && !result && (
            <View style={styles.controlBar}>
              {mediaUri ? (
                <View style={styles.actionRow}>
                  <Pressable style={styles.btnSecondary} onPress={resetScanner}>
                    <Icon name="close" size={24} color="#546E7A" />
                  </Pressable>
                  
                  <Pressable 
                    style={({pressed}) => [styles.btnPrimary, pressed && {transform: [{scale: 0.96}]}]} 
                    onPress={handleAnalyze}
                  >
                    <Icon name="feature-search-outline" size={24} color="#fff" />
                    <Text style={styles.btnPrimaryText}>CHẨN ĐOÁN AI</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.mediaRow}>
                  <Pressable style={styles.mediaBtn} onPress={() => handleSelectMedia('library')}>
                    <View style={[styles.mediaIcon, {backgroundColor: '#E8F5E9'}]}>
                      <Icon name="image-multiple" size={28} color={PRIMARY_GREEN} />
                    </View>
                    <Text style={styles.mediaLabel}>Thư viện</Text>
                  </Pressable>

                  <Pressable style={styles.mediaBtn} onPress={() => handleSelectMedia('camera')}>
                    <View style={[styles.mediaIcon, {backgroundColor: '#E8F5E9'}]}>
                      <Icon name="camera-iris" size={32} color={PRIMARY_GREEN} />
                    </View>
                    <Text style={styles.mediaLabel}>Chụp ảnh</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {result && (
          <Animated.View style={[styles.resultDashboard, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#F1F8E9' }]}>
                <Text style={styles.statTitle}>TỔNG ĐÀN</Text>
                <Text style={styles.statNumber}>{result.total_chickens}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.statTitle, {color: '#2E7D32'}]}>KHỎE MẠNH</Text>
                <Text style={[styles.statNumber, {color: '#2E7D32'}]}>{result.healthy_count}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: result.sick_count > 0 ? '#FFEBEE' : '#FAFAFA' }]}>
                <Text style={[styles.statTitle, {color: result.sick_count > 0 ? '#C62828' : '#B0BEC5'}]}>BỆNH</Text>
                <Text style={[styles.statNumber, {color: result.sick_count > 0 ? '#C62828' : '#B0BEC5'}]}>{result.sick_count}</Text>
              </View>
            </View>

            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Icon name="file-chart-outline" size={22} color={DARK_GREEN} />
                <Text style={[styles.reportTitle, {color: DARK_GREEN}]}>Báo cáo chẩn đoán</Text>
              </View>
              <Text style={styles.reportText}>
                {result.sick_count === 0 
                  ? "Tuyệt vời! Hệ thống không phát hiện bất kỳ cá thể nào có dấu hiệu bệnh lý. Hãy duy trì điều kiện chăm sóc hiện tại." 
                  : `Cảnh báo: Đã phát hiện ${result.sick_count} cá thể có triệu chứng ủ rũ hoặc bất thường. Bạn nên cách ly ngay để tránh lây lan.`}
              </Text>
            </View>

            <View style={styles.finalActions}>
              <TouchableOpacity style={styles.btnOutline} onPress={resetScanner}>
                <Text style={styles.btnOutlineText}>QUÉT LẠI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSolid, {backgroundColor: PRIMARY_GREEN}]}>
                <Icon name="content-save-check-outline" size={20} color="#fff" />
                <Text style={styles.btnSolidText}>LƯU NHẬT KÝ</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, elevation: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#546E7A' },
  scannerContainer: { alignItems: 'center', marginHorizontal: 20, marginTop: 20 },
  scannerFrame: { width: CARD_WIDTH, height: CARD_WIDTH * 0.85, borderRadius: 28, backgroundColor: '#fff', elevation: 8, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  placeholderState: { alignItems: 'center' },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#263238' },
  placeholderHint: { fontSize: 13, color: '#90A4AE', marginTop: 5 },
  laserLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#00E676', shadowColor: '#00E676', shadowOpacity: 1, shadowRadius: 10 },
  resultLabelTag: { position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, elevation: 4 },
  resultLabelText: { color: '#fff', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },
  controlBar: { marginTop: 30, width: '100%' },
  mediaRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
  mediaBtn: { alignItems: 'center' },
  mediaIcon: { width: 70, height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4 },
  mediaLabel: { fontSize: 14, fontWeight: '700', color: '#455A64' },
  actionRow: { flexDirection: 'row', gap: 15, justifyContent: 'center', width: '100%', paddingHorizontal: 20 },
  btnSecondary: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { flex: 1, height: 56, backgroundColor: '#2e7d32', borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultDashboard: { marginTop: 30, paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: { flex: 1, padding: 15, borderRadius: 18, alignItems: 'center', height: 100, justifyContent: 'center' },
  statTitle: { fontSize: 10, fontWeight: 'bold', color: '#546E7A', marginBottom: 6 },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#263238' },
  reportCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#E8F5E9' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  reportTitle: { fontSize: 16, fontWeight: 'bold' },
  reportText: { fontSize: 14, color: '#546E7A', lineHeight: 22 },
  finalActions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  btnOutline: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#CFD8DC', justifyContent: 'center', alignItems: 'center' },
  btnOutlineText: { color: '#78909C', fontWeight: 'bold' },
  btnSolid: { flex: 2, height: 52, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  btnSolidText: { color: '#fff', fontWeight: 'bold' }
});

export default DetectScreen;
