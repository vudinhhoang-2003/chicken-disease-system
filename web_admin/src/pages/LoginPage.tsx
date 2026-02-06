import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Paper, 
  Container, Alert, Stack, InputAdornment, IconButton,
  Grid
} from '@mui/material';
import { 
  Visibility, VisibilityOff, Lock as LockIcon, 
  Email as EmailIcon, Login as LoginIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // API Login yêu cầu format form-data cho OAuth2
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { access_token, user_role, user_name } = response.data;

      if (user_role !== 'admin') {
        throw new Error('Chỉ tài khoản Quản trị viên mới được phép truy cập trang này.');
      }

      login(access_token, { name: user_name, role: user_role });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        bgcolor: '#f4f6f8'
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* Left Side - Image/Branding */}
        <Grid 
          item xs={12} md={6} 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#1b5e20'
          }}
        >
          {/* Decorative Circle */}
          <Box 
            sx={{
              position: 'absolute',
              width: '800px', height: '800px',
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
              top: '-20%', left: '-20%'
            }}
          />
          
          <Box sx={{ zIndex: 1, textAlign: 'center', p: 5 }}>
             <Box 
                sx={{ 
                  width: 100, height: 100, borderRadius: 3, bgcolor: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 4, mx: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
              >
                <img src="/favicon.png" alt="Logo" style={{ width: 64, height: 64 }} />
              </Box>
            <Typography variant="h2" color="white" fontWeight="800" gutterBottom>
              CHICKHEALTH
            </Typography>
            <Typography variant="h5" color="rgba(255,255,255,0.8)" sx={{ maxWidth: 480, mx: 'auto' }}>
              Hệ thống quản lý và giám sát sức khỏe gia cầm thông minh 4.0
            </Typography>
          </Box>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid 
          item xs={12} md={6} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4
          }}
        >
          <Stack spacing={4} sx={{ width: '100%', maxWidth: 480 }}>
            <Box>
              <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
                Đăng nhập Admin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Nhập thông tin xác thực để truy cập hệ thống quản trị.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? null : <LoginIcon />}
                  sx={{ 
                    py: 1.5,
                    fontSize: '1rem',
                    bgcolor: '#2e7d32',
                    '&:hover': { bgcolor: '#1b5e20' }
                  }}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                </Button>
              </Stack>
            </form>

            <Box textAlign="center">
              <Typography variant="caption" color="text.disabled">
                Protected by ChickHealth Security System v1.0
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
