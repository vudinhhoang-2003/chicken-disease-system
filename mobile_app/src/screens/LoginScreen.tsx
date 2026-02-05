import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Dimensions, StatusBar 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const PRIMARY_GREEN = '#2e7d32';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Bà con vui lòng nhập đầy đủ email và mật khẩu nhé!');
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await client.post('/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      await login(access_token);
      // navigation.replace('Home'); // REMOVED: Navigator will auto-switch based on auth state

    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi đăng nhập', 'Email hoặc mật khẩu không đúng. Bà con kiểm tra lại nhé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />
      
      <View style={[styles.headerBackground, {backgroundColor: PRIMARY_GREEN}]}>
        <View style={styles.circleDecoration} />
        <View style={styles.headerContent}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.appName}>ChickHealth</Text>
          <Text style={styles.tagline}>Chăm sóc đàn gà bằng trí tuệ nhân tạo</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>Đăng nhập hệ thống</Text>
          <Text style={styles.subText}>Vui lòng điền thông tin tài khoản</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}>
                <Icon name="account-circle-outline" size={22} color={PRIMARY_GREEN} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email hoặc Số điện thoại"
                placeholderTextColor="#90A4AE"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}>
                <Icon name="lock-outline" size={22} color={PRIMARY_GREEN} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#90A4AE"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                 <Icon name={secureText ? "eye-off-outline" : "eye-outline"} size={22} color="#B0BEC5" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, {backgroundColor: PRIMARY_GREEN}]} 
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.regLabel}>Bà con chưa có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.regHighlight, {color: PRIMARY_GREEN}]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <Text style={styles.footerText}>Phiên bản 1.0.0 • Kết nối nông thôn</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBackground: { height: '42%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', justifyContent: 'center', paddingBottom: 50, position: 'relative', overflow: 'hidden' },
  circleDecoration: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  headerContent: { alignItems: 'center' },
  logo: { width: 90, height: 90, resizeMode: 'contain', marginBottom: 15 },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: '500' },
  keyboardView: { flex: 1, alignItems: 'center', marginTop: -60 },
  formCard: { width: width - 40, backgroundColor: '#fff', borderRadius: 28, padding: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#263238', textAlign: 'center', marginBottom: 5 },
  subText: { fontSize: 14, color: '#90A4AE', textAlign: 'center', marginBottom: 30 },
  inputContainer: { gap: 18 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: '#ECEFF1' },
  iconBox: { width: 30, alignItems: 'center' },
  input: { flex: 1, fontSize: 16, color: '#37474F', marginLeft: 10 },
  eyeIcon: { padding: 10 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 15, marginBottom: 25 },
  forgotText: { color: '#78909C', fontWeight: '600', fontSize: 13 },
  loginBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 } },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, gap: 5 },
  regLabel: { color: '#78909C', fontSize: 14 },
  regHighlight: { fontWeight: '900', fontSize: 14 },
  footerText: { textAlign: 'center', color: '#B0BEC5', fontSize: 11, marginBottom: 20 }
});

export default LoginScreen;