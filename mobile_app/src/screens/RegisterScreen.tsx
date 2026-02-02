import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import client from '../api/client';

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    const { email, full_name, phone, password, confirmPassword } = formData;

    if (!email || !full_name || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/auth/register', {
        email,
        full_name,
        phone,
        password
      });

      const { access_token } = response.data;
      await AsyncStorage.setItem('token', access_token);
      
      Alert.alert('Thành công', 'Tài khoản của bạn đã được khởi tạo!', [
        { text: 'Vào App', onPress: () => navigation.replace('Home') }
      ]);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Đăng ký thất bại. Email có thể đã tồn tại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo tài khoản mới</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên của bạn"
              placeholderTextColor="#999"
              value={formData.full_name}
              onChangeText={(val) => setFormData({...formData, full_name: val})}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="phone-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => setFormData({...formData, phone: val})}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email đăng ký"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(val) => setFormData({...formData, email: val})}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry={secureText}
              value={formData.password}
              onChangeText={(val) => setFormData({...formData, password: val})}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
               <Icon name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry={secureText}
              value={formData.confirmPassword}
              onChangeText={(val) => setFormData({...formData, confirmPassword: val})}
            />
          </View>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>ĐĂNG KÝ NGAY</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkLabel}>Đã có tài khoản? <Text style={styles.loginLinkHighlight}>Đăng nhập</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32' },
  formContainer: { padding: 30 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 30,
    paddingBottom: 8,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 5 },
  registerButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  loginLink: { alignItems: 'center', marginTop: 35 },
  loginLinkLabel: { color: '#7f8c8d', fontSize: 15 },
  loginLinkHighlight: { color: '#2e7d32', fontWeight: 'bold' }
});

export default RegisterScreen;
