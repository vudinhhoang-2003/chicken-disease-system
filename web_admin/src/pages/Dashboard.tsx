import { Typography, Grid, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Dashboard = () => {
  // Gọi API lấy thống kê
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Không thể tải dữ liệu thống kê</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tổng quan hệ thống
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd', borderLeft: '5px solid #2196f3' }}>
            <Typography variant="subtitle1" color="text.secondary">Tổng lượt chẩn đoán</Typography>
            <Typography variant="h3">{stats?.total_diagnosis || 0}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fbe9e7', borderLeft: '5px solid #ff5722' }}>
            <Typography variant="subtitle1" color="text.secondary">Ca phát hiện bệnh</Typography>
            <Typography variant="h3">{stats?.sick_cases || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', borderLeft: '5px solid #4caf50' }}>
            <Typography variant="subtitle1" color="text.secondary">Phân tích phân</Typography>
            <Typography variant="h3">{stats?.total_fecal_analysis || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff3e0', borderLeft: '5px solid #ff9800' }}>
            <Typography variant="subtitle1" color="text.secondary">Giám sát hành vi</Typography>
            <Typography variant="h3">{stats?.total_detections || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>Hướng dẫn sử dụng nhanh</Typography>
        <Typography variant="body1">
          Hệ thống đang hoạt động ổn định. Bạn có thể xem chi tiết các ca chẩn đoán trong mục <b>Lịch sử chẩn đoán</b> hoặc cập nhật kiến thức cho AI trong mục <b>Kiến thức (RAG)</b>.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;