import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }: any) => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const PRIMARY_GREEN = '#2e7d32';

  const handleRegister = async () => {
    const { email, full_name, phone, password, confirmPassword } = formData;

    if (!full_name || !phone || !password || !confirmPassword) {
      Alert.alert('Thông báo', 'Bà con vui lòng điền đầy đủ Họ tên, Số điện thoại và Mật khẩu nhé!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu nhập lại không giống cái trên. Bà con kiểm tra kỹ nhé.');
      return;
    }

    setLoading(true);
    try {
      // Nếu không nhập email, ta gửi chuỗi rỗng hoặc backend xử lý
      const response = await client.post('/auth/register', {
        email: email || null,
        full_name,
        phone,
        password
      });

      const { access_token } = response.data;
      
      Alert.alert('Chúc mừng!', 'Tài khoản của bà con đã tạo xong rồi.', [
        { text: 'Vào ứng dụng ngay', onPress: async () => {
          try {
            await login(access_token);
          } catch (e) {
            console.error(e);
            navigation.navigate('Login');
          }
        } }
      ]);

    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Không tạo được tài khoản. Có thể email này đã dùng rồi.';
      Alert.alert('Lỗi đăng ký', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.navHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={26} color="#263238" />
              </TouchableOpacity>
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Đăng ký</Text>
              <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu giám sát đàn gà</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="account-outline" size={22} color={PRIMARY_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#B0BEC5"
                    value={formData.full_name}
                    onChangeText={(val) => setFormData({...formData, full_name: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone-outline" size={22} color={PRIMARY_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0912345xxx"
                    placeholderTextColor="#B0BEC5"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(val) => setFormData({...formData, phone: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (Không bắt buộc)</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="email-outline" size={22} color={PRIMARY_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="email@gmail.com"
                    placeholderTextColor="#B0BEC5"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(val) => setFormData({...formData, email: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-outline" size={22} color={PRIMARY_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tối thiểu 6 ký tự"
                    placeholderTextColor="#B0BEC5"
                    secureTextEntry={secureText}
                    value={formData.password}
                    onChangeText={(val) => setFormData({...formData, password: val})}
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <Icon name={secureText ? "eye-off-outline" : "eye-outline"} size={22} color="#B0BEC5" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nhập lại mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-check-outline" size={22} color={PRIMARY_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Xác nhận lại mật khẩu"
                    placeholderTextColor="#B0BEC5"
                    secureTextEntry={secureText}
                    value={formData.confirmPassword}
                    onChangeText={(val) => setFormData({...formData, confirmPassword: val})}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, {backgroundColor: PRIMARY_GREEN}]} 
                onPress={handleRegister} 
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>ĐĂNG KÝ TÀI KHOẢN</Text>}
              </TouchableOpacity>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkLabel}>Đã có tài khoản?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.loginLinkHighlight, {color: PRIMARY_GREEN}]}> Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 40 },
  navHeader: { paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
  headerTextContainer: { paddingHorizontal: 30, marginTop: 25, marginBottom: 25 },
  title: { fontSize: 32, fontWeight: '900', color: '#263238', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#78909C', fontWeight: '500' },
  formContainer: { paddingHorizontal: 30, gap: 18 },
  inputGroup: {},
  label: { fontSize: 13, fontWeight: '800', color: '#455A64', marginBottom: 8, marginLeft: 4, letterSpacing: 0.3 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: '#ECEFF1', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#263238' },
  registerButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 6, shadowOpacity: 0.3, shadowRadius: 8 },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  loginLinkLabel: { color: '#78909C', fontSize: 14 },
  loginLinkHighlight: { fontWeight: '900', fontSize: 14 }
});

export default RegisterScreen;
