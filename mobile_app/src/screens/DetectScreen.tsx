import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const { width } = Dimensions.get('window');

const DetectScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSelectImage = (type: 'camera' | 'library') => {
    const options = { mediaType: 'photo' as MediaType, quality: 0.9, maxWidth: 1280, maxHeight: 1280 };
    const callback = (response: any) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setImageFile({ uri: asset.uri, type: asset.type, name: asset.fileName || 'detect.jpg' });
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
      formData.append('file', { uri: imageFile.uri, type: imageFile.type, name: imageFile.name });
      const response = await client.post('/detect/detect', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(response.data);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể phân tích dữ liệu đàn gà.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Top Monitor Area */}
        <View style={styles.monitorContainer}>
          <View style={styles.monitorWrapper}>
            {result ? (
              <Image source={{ uri: `data:image/jpeg;base64,${result.image_base64}` }} style={styles.image} resizeMode="contain" />
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Icon name="radar" size={80} color="#CFD8DC" />
                <Text style={styles.placeholderTitle}>Chế độ Giám sát</Text>
                <Text style={styles.placeholderSub}>AI sẽ quét và đếm số lượng gà khỏe/ốm trong đàn</Text>
              </View>
            )}
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#2196F3" size="large" />
                <Text style={styles.loadingText}>ĐANG PHÂN TÍCH ĐÀN GÀ...</Text>
              </View>
            )}

            {/* Float Buttons */}
            {!loading && (
              <View style={styles.floatingActions}>
                <TouchableOpacity style={styles.floatBtnSmall} onPress={() => handleSelectImage('library')}>
                  <Icon name="folder-multiple-image" size={22} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.floatBtnLarge, {backgroundColor: '#1976D2'}]} onPress={() => handleSelectImage('camera')}>
                  <Icon name="camera" size={28} color="#fff" />
                </TouchableOpacity>
                {imageUri && !result && (
                  <TouchableOpacity style={[styles.floatBtnSmall, {backgroundColor: '#1976D2'}]} onPress={handleAnalyze}>
                    <Icon name="magnify" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Dashboard Stats */}
        {result && (
          <View style={styles.dashboard}>
            <View style={styles.row}>
              <View style={[styles.statItem, {backgroundColor: '#E3F2FD'}]}>
                <Text style={styles.statLabel}>TỔNG ĐÀN</Text>
                <Text style={[styles.statValue, {color: '#1976D2'}]}>{result.total_chickens}</Text>
              </View>
              <View style={[styles.statItem, {backgroundColor: '#E8F5E9'}]}>
                <Text style={styles.statLabel}>KHỎE MẠNH</Text>
                <Text style={[styles.statValue, {color: '#2E7D32'}]}>{result.healthy_count}</Text>
              </View>
              <View style={[styles.statItem, {backgroundColor: '#FFEBEE'}]}>
                <Text style={styles.statLabel}>BỆNH/Ủ RŨ</Text>
                <Text style={[styles.statValue, {color: '#C62828'}]}>{result.sick_count}</Text>
              </View>
            </View>

            <View style={[styles.alertCard, { borderColor: result.sick_count > 0 ? '#FFCDD2' : '#C8E6C9' }]}>
              <View style={[styles.alertHeader, { backgroundColor: result.sick_count > 0 ? '#D32F2F' : '#388E3C' }]}>
                <Icon name={result.sick_count > 0 ? "alert-outline" : "check-decagram"} size={20} color="#fff" />
                <Text style={styles.alertTitle}>{result.sick_count > 0 ? 'CẢNH BÁO RỦI RO' : 'HỆ THỐNG AN TOÀN'}</Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertMsg}>{result.alert || 'Đàn gà hoạt động bình thường, không phát hiện dấu hiệu bất thường.'}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.resetBtn} onPress={() => {setResult(null); setImageUri(null);}}>
              <Text style={styles.resetBtnText}>QUÉT ĐÀN MỚI</Text>
            </TouchableOpacity>
          </View>
        )}

        {!result && !loading && (
          <View style={styles.infoSection}>
             <Text style={styles.infoTitle}>Tại sao cần giám sát đàn?</Text>
             <Text style={styles.infoDesc}>
               Việc phát hiện sớm 1-2 cá thể có dấu hiệu ủ rũ giúp bạn ngăn chặn dịch bệnh lây lan ra toàn đàn (50-100 con), tiết kiệm hàng triệu đồng chi phí thuốc và thiệt hại.
             </Text>
          </View>
        )}

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1 },
  monitorContainer: { padding: 20, paddingTop: 30 },
  monitorWrapper: {
    width: width - 40,
    height: 400,
    borderRadius: 25,
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    overflow: 'hidden',
    position: 'relative'
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3F4' },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#546E7A', marginTop: 15 },
  placeholderSub: { fontSize: 13, color: '#90A4AE', textAlign: 'center', marginTop: 5, paddingHorizontal: 40 },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: { marginTop: 15, color: '#1976D2', fontWeight: 'bold', letterSpacing: 1 },

  floatingActions: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15
  },
  floatBtnSmall: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', elevation: 5
  },
  floatBtnLarge: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)'
  },

  dashboard: { paddingHorizontal: 20, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  statItem: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#78909C', marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: '900' },

  alertCard: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', borderWidth: 1, marginBottom: 20 },
  alertHeader: { padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  alertBody: { padding: 15 },
  alertMsg: { fontSize: 14, color: '#455A64', lineHeight: 20 },

  resetBtn: {
    backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#1976D2'
  },
  resetBtnText: { color: '#1976D2', fontWeight: 'bold', letterSpacing: 1 },

  infoSection: { padding: 30, opacity: 0.8 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginBottom: 10 },
  infoDesc: { fontSize: 14, color: '#607D8B', lineHeight: 22 }
});

export default DetectScreen;
