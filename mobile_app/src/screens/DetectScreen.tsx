import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, Image, 
  ScrollView, ActivityIndicator, Alert, Dimensions, Linking, Platform, PermissionsAndroid, Animated
} from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const { width } = Dimensions.get('window');

const DetectScreen = () => {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [videoResult, setVideoResult] = useState<any>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Hiệu ứng nhấn nút
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Quyền truy cập Camera",
            message: "Ứng dụng cần truy cập Camera để chụp ảnh/quay video đàn gà.",
            buttonNeutral: "Hỏi lại sau",
            buttonNegative: "Hủy",
            buttonPositive: "Đồng ý"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSelectMedia = async (source: 'camera' | 'library', type: 'photo' | 'video') => {
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert("Quyền bị từ chối", "Bạn cần cấp quyền Camera để sử dụng tính năng này.");
        return;
      }
    }

    const options = { 
      mediaType: type as MediaType, 
      quality: 0.9, 
      maxWidth: 1280, 
      maxHeight: 1280,
      durationLimit: 10,
      videoQuality: 'medium' as const
    };
    
    const callback = (response: any) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Lỗi Camera', response.errorMessage);
        return;
      }
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        setMediaUri(asset.uri);
        setMediaType(type);
        setMediaFile({ uri: asset.uri, type: asset.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'), name: asset.fileName || `input.${type === 'video' ? 'mp4' : 'jpg'}` });
        setResult(null);
        setVideoResult(null);
        setShowVideo(false);
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
      
      let endpoint = '/detect/detect';
      if (mediaType === 'video') {
        endpoint = '/detect/video_analyze';
      }

      const response = await client.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (mediaType === 'video') {
        setVideoResult(response.data);
      } else {
        setResult(response.data);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể phân tích dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getVideoHtml = (url: string) => {
    // Dùng localhost vì đã có adb reverse proxy (ổn định hơn 10.0.2.2 trên một số máy)
    const fullUrl = `http://localhost:8000${url}`;
    
    return `
      <html>
        <body style="margin:0;padding:0;background-color:#000;display:flex;justify-content:center;align-items:center;height:100%;">
          <video 
            src="${fullUrl}" 
            width="100%" 
            height="100%" 
            controls 
            autoplay 
            style="max-width:100%;max-height:100%;"
          >
            Trình duyệt không hỗ trợ video.
          </video>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Top Monitor Area */}
        <View style={styles.monitorContainer}>
          <View style={styles.monitorWrapper}>
            {result ? (
              <Image source={{ uri: `data:image/jpeg;base64,${result.image_base64}` }} style={styles.image} resizeMode="contain" />
            ) : mediaType === 'video' && videoResult ? (
               showVideo ? (
                 // Hiển thị GIF động thay vì Video Player
                 <Image 
                    source={{ uri: `http://localhost:8000${videoResult.gif_url}` }} 
                    style={styles.image} 
                    resizeMode="contain" 
                 />
               ) : (
                 <View style={styles.videoPlaceholder}>
                   <Icon name="movie-check" size={60} color="#4CAF50" />
                   <Text style={styles.videoSuccessText}>PHÂN TÍCH HOÀN TẤT</Text>
                   <Pressable 
                    style={({pressed}) => [styles.playBtn, pressed && {opacity: 0.8}]} 
                    onPress={() => setShowVideo(true)}
                   >
                     <Icon name="play-circle" size={32} color="#fff" />
                     <Text style={{color:'#fff', fontWeight:'bold'}}>XEM KẾT QUẢ</Text>
                   </Pressable>
                 </View>
               )
            ) : mediaUri ? (
              mediaType === 'video' ? (
                <View style={styles.videoPlaceholder}>
                  <Icon name="video" size={50} color="#1976D2" />
                  <Text style={{color:'#555', marginTop:10}}>Video đã sẵn sàng</Text>
                </View>
              ) : (
                <Image source={{ uri: mediaUri }} style={styles.image} />
              )
            ) : (
              <View style={styles.placeholder}>
                <Icon name="radar" size={80} color="#CFD8DC" />
                <Text style={styles.placeholderTitle}>Chế độ Giám sát</Text>
                <Text style={styles.placeholderSub}>AI sẽ quét và đếm số lượng gà khỏe/ốm trong đàn</Text>
              </View>
            )}
          </View>
          
          {/* Controls Area */}
          <View style={styles.controlsArea}>
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#2196F3" size="small" />
                <Text style={styles.loadingTextSmall}>
                  {mediaType === 'video' ? 'Đang xử lý video...' : 'Đang phân tích...'}
                </Text>
              </View>
            )}

            {!loading && !result && !videoResult && (
              <View style={styles.actionButtons}>
                {/* Library Button */}
                <Animated.View style={{ transform: [{ scale: mediaType === 'photo' && !mediaUri ? 1 : 1 }] }}>
                  <Pressable 
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => handleSelectMedia('library', 'photo')}
                    style={styles.btnOption}
                  >
                    <View style={[styles.iconCircle, {backgroundColor: '#f5f5f5'}]}>
                      <Icon name="image-multiple" size={24} color="#455A64" />
                    </View>
                    <Text style={styles.btnLabel}>Thư viện</Text>
                  </Pressable>
                </Animated.View>
                
                {/* Photo Button */}
                <Pressable 
                  onPress={() => handleSelectMedia('camera', 'photo')}
                  style={styles.btnMain}
                >
                  {({ pressed }) => (
                    <View style={{alignItems: 'center'}}>
                      <View style={[
                        styles.iconCircleLarge, 
                        {backgroundColor: '#1976D2', transform: [{ scale: pressed ? 0.9 : 1 }]}
                      ]}>
                        <Icon name="camera" size={32} color="#fff" />
                      </View>
                      <Text style={styles.btnLabelMain}>Chụp ảnh</Text>
                    </View>
                  )}
                </Pressable>

                {/* Video Button */}
                <Pressable 
                  onPress={() => handleSelectMedia('camera', 'video')}
                  style={styles.btnMain}
                >
                  {({ pressed }) => (
                    <View style={{alignItems: 'center'}}>
                      <View style={[
                        styles.iconCircleLarge, 
                        {backgroundColor: '#E64A19', transform: [{ scale: pressed ? 0.9 : 1 }]}
                      ]}>
                        <Icon name="video" size={32} color="#fff" />
                      </View>
                      <Text style={styles.btnLabelMain}>Quay video</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
            
            {mediaUri && !loading && !result && !videoResult && (
               <Pressable 
                onPress={handleAnalyze}
                style={({ pressed }) => [
                  styles.analyzeBtn,
                  pressed && { backgroundColor: '#1A237E', transform: [{ scale: 0.95 }] }
                ]}
               >
                 <Text style={styles.analyzeText}>BẮT ĐẦU QUÉT</Text>
                 <Icon name="arrow-right" size={20} color="#fff" />
               </Pressable>
            )}
          </View>

        </View>

        {/* Dashboard Stats */}
        {(result || videoResult) && (
          <View style={styles.dashboard}>
            <View style={styles.row}>
              <View style={[styles.statItem, {backgroundColor: '#E3F2FD'}]}>
                <Text style={styles.statLabel}>TỔNG ĐÀN</Text>
                <Text style={[styles.statValue, {color: '#1976D2'}]}>
                  {result ? result.total_chickens : videoResult.max_total_chickens}
                </Text>
              </View>
              <View style={[styles.statItem, {backgroundColor: '#FFEBEE'}]}>
                <Text style={styles.statLabel}>BỆNH (MAX)</Text>
                <Text style={[styles.statValue, {color: '#C62828'}]}>
                  {result ? result.sick_count : videoResult.max_sick_chickens}
                </Text>
              </View>
            </View>

            <View style={[styles.alertCard, { borderColor: (result?.sick_count > 0 || videoResult?.max_sick_chickens > 0) ? '#FFCDD2' : '#C8E6C9' }]}>
              <View style={[styles.alertHeader, { backgroundColor: (result?.sick_count > 0 || videoResult?.max_sick_chickens > 0) ? '#D32F2F' : '#388E3C' }]}>
                <Icon name="alert-circle-outline" size={20} color="#fff" />
                <Text style={styles.alertTitle}>KẾT QUẢ PHÂN TÍCH</Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertMsg}>
                  {result ? result.alert : videoResult.alert || 'Không phát hiện dấu hiệu bất thường.'}
                </Text>
              </View>
            </View>
            
            <Pressable 
              style={({pressed}) => [styles.resetBtn, pressed && {backgroundColor: '#f5f5f5'}]} 
              onPress={() => {setResult(null); setVideoResult(null); setMediaUri(null); setShowVideo(false);}}
            >
              <Text style={styles.resetBtnText}>QUÉT MỚI</Text>
            </Pressable>
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
    height: 350, // Giảm chiều cao chút để nhường chỗ cho nút
    borderRadius: 25,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
    marginBottom: 20
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  // New Controls Styles
  controlsArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10
  },
  btnOption: { alignItems: 'center', marginHorizontal: 10 },
  btnMain: { alignItems: 'center', marginHorizontal: 10 },
  
  iconCircle: {
    width: 50, height: 50, borderRadius: 25, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 5,
    elevation: 2
  },
  iconCircleLarge: {
    width: 65, height: 65, borderRadius: 35, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    elevation: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5
  },
  
  btnLabel: { fontSize: 12, color: '#555', fontWeight: '500' },
  btnLabelMain: { fontSize: 13, color: '#333', fontWeight: 'bold' },

  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  loadingTextSmall: { color: '#1976D2', fontWeight: '600' },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#2962FF', paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 30, elevation: 5, marginTop: 10
  },
  analyzeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3F4' },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#546E7A', marginTop: 15 },
  placeholderSub: { fontSize: 13, color: '#90A4AE', textAlign: 'center', marginTop: 5, paddingHorizontal: 40 },
  
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2F1' },
  videoSuccessText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  playBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, 
    backgroundColor: '#43A047', paddingVertical: 10, paddingHorizontal: 20, 
    borderRadius: 30, marginTop: 20, elevation: 5
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
