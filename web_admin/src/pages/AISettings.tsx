import { useEffect, useState } from 'react';
import { 
  Typography, Box, Button, TextField, Snackbar, Alert, 
  CircularProgress, Card, CardContent, Grid, MenuItem, 
  Slider, Divider, InputAdornment, IconButton, Fade,
  Paper, Container
} from '@mui/material';
import { 
  Save as SaveIcon, Visibility, VisibilityOff, 
  SettingsSuggest as ConfigIcon, PlayCircleOutline as TestIcon,
  Psychology as BrainIcon, Storage as StorageIcon,
  CheckCircle as CheckIcon, FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { adminApi } from '../services/api';

const AISettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    ai_provider: 'groq',
    ai_groq_key: '',
    ai_gemini_key: '',
    ai_model: 'openai/gpt-oss-120b',
    ai_temperature: 0.2,
    ai_system_prompt: ''
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      const newConfig = { ...config };
      response.data.forEach((s: any) => {
        if (s.key in newConfig) {
          (newConfig as any)[s.key] = s.key === 'ai_temperature' ? parseFloat(s.value) : s.value;
        }
      });
      setConfig(newConfig);
    } catch (error) {
      console.error('Lỗi khi tải cấu hình:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(config).map(([key, value]) => 
        adminApi.updateSetting({ key, value: value.toString() })
      );
      await Promise.all(promises);
      const now = new Date().toLocaleTimeString();
      setLastSaved(now);
      setNotification({ message: 'Cấu hình đã được áp dụng thành công!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Lưu cấu hình thất bại', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await adminApi.testAI(config);
      if (response.data.status === 'success') {
        setNotification({ message: 'Kết nối thành công! AI đã phản hồi.', type: 'success' });
      } else {
        setNotification({ message: 'Lỗi: ' + response.data.message, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Lỗi kết nối server', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth={false} sx={{ pb: 10 }}>
      {/* Status Banner - Rộng rãi và chuyên nghiệp */}
      <Fade in={true}>
        <Paper elevation={0} sx={{ 
          p: 2, px: 3, mb: 4, borderRadius: 3, 
          bgcolor: '#e8f5e9', border: '1px solid #c8e6c9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ position: 'relative', display: 'flex' }}>
              <DotIcon sx={{ color: '#2e7d32', fontSize: 14 }} />
              <Box sx={{ 
                position: 'absolute', width: 14, height: 14, borderRadius: '50%', 
                bgcolor: '#2e7d32', opacity: 0.4,
                animation: 'pulse 2s infinite ease-in-out'
              }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#1b5e20', fontWeight: '900', letterSpacing: 1 }}>
              HỆ THỐNG AI ĐANG TRỰC TUYẾN
            </Typography>
          </Box>
          <Box display="flex" gap={4}>
            <Typography variant="body2" color="textSecondary">
              Provider: <b style={{color: '#2e7d32'}}>{config.ai_provider.toUpperCase()}</b>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Model: <b style={{color: '#2e7d32'}}>{config.ai_model}</b>
            </Typography>
            {lastSaved && (
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                Đồng bộ lúc: {lastSaved}
              </Typography>
            )}
          </Box>
        </Paper>
      </Fade>

      <Box mb={5} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <BrainIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight="900" color="#1a237e">AI Control Center</Typography>
            <Typography variant="body1" color="textSecondary">Quản lý và điều phối trí tuệ nhân tạo ChickHealth</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          size="medium" 
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} 
          onClick={handleSaveAll}
          disabled={saving}
          sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 'bold' }}
        >
          {saving ? 'ĐANG LƯU...' : 'LƯU TẤT CẢ'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* API Connection Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', height: '100%', border: '1px solid #f0f0f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={4}>
                <StorageIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Kết nối nền tảng</Typography>
              </Box>

              <TextField
                select
                label="AI Provider"
                fullWidth
                value={config.ai_provider}
                onChange={(e) => setConfig({...config, ai_provider: e.target.value})}
                sx={{ mb: 4 }}
              >
                <MenuItem value="groq">Groq Cloud (Tốc độ cao)</MenuItem>
                <MenuItem value="gemini">Google Gemini (Đa năng)</MenuItem>
              </TextField>

              <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 3 }}>
                {config.ai_provider === 'groq' ? (
                  <Box>
                    <TextField
                      label="Groq API Key"
                      fullWidth
                      type={showGroqKey ? 'text' : 'password'}
                      value={config.ai_groq_key}
                      onChange={(e) => setConfig({...config, ai_groq_key: e.target.value})}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowGroqKey(!showGroqKey)}><Visibility /></IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ mb: 3 }}
                    />
                    <TextField
                      label="Model Name"
                      fullWidth
                      value={config.ai_model}
                      onChange={(e) => setConfig({...config, ai_model: e.target.value})}
                    />
                  </Box>
                ) : (
                  <Box>
                    <TextField
                      label="Gemini API Key"
                      fullWidth
                      type={showGeminiKey ? 'text' : 'password'}
                      value={config.ai_gemini_key}
                      onChange={(e) => setConfig({...config, ai_gemini_key: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <TextField
                      label="Model Name"
                      fullWidth
                      value={config.ai_model}
                      onChange={(e) => setConfig({...config, ai_model: e.target.value})}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Config Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', height: '100%', border: '1px solid #f0f0f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={4}>
                <ConfigIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Tham số phản hồi</Typography>
              </Box>

              <Box mb={5}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1" fontWeight="bold">Temperature</Typography>
                  <Typography variant="h6" color="primary" fontWeight="900">{config.ai_temperature}</Typography>
                </Box>
                <Slider
                  value={config.ai_temperature}
                  min={0} max={1} step={0.1}
                  onChange={(_, val) => setConfig({...config, ai_temperature: val as number})}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Chỉnh độ "sáng tạo" của AI. 0 là máy móc, 1 là bay bổng.
                </Typography>
              </Box>

              <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

              <Button 
                variant="outlined" 
                startIcon={testing ? <CircularProgress size={18} /> : <TestIcon />}
                size="medium"
                onClick={handleTestConnection}
                disabled={testing}
                sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}
              >
                {testing ? 'Đang kiểm tra...' : 'Chạy thử kết nối'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Expert Persona Card */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <BrainIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Định hướng Chuyên gia (System Prompt)</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" mb={3}>
                Thiết lập vai diễn và quy tắc cho AI. Dùng <b>{'{context}'}</b> để chèn kiến thức từ Database.
              </Typography>
              <TextField
                multiline rows={8} fullWidth
                placeholder="Ví dụ: Bạn là một bác sĩ thú y tận tâm..."
                value={config.ai_system_prompt}
                onChange={(e) => setConfig({...config, ai_system_prompt: e.target.value})}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fcfcfc', fontSize: 16 } }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      `}</style>

      <Snackbar 
        open={!!notification} 
        autoHideDuration={4000} 
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type} 
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 'bold' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AISettings;
