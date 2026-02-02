import { Typography, Grid, Paper, Box, CircularProgress, Alert, Card, CardContent, Container } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Area, ComposedChart
} from 'recharts';
import {
  Assessment as AssessmentIcon,
  HealthAndSafety as HealthIcon,
  BugReport as VirusIcon,
  Pets as ChickenIcon
} from '@mui/icons-material';
import api from '../services/api';

const CHART_COLORS = ['#00c853', '#ff3d00', '#2979ff', '#ffd600', '#aa00ff', '#00b8d4'];

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Không thể tải dữ liệu thống kê</Alert>;

  const chartData = stats?.chart_data || [];
  const pieData = stats?.pie_data || [];

  const StatCard = ({ title, value, icon, color, bgColor }: any) => (
    <Card sx={{
      height: '100%',
      borderRadius: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 10px 30px ${color}20` }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: bgColor, color: color, display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth={false} sx={{ py: 3, bgcolor: '#f8f9fc', minHeight: '100vh' }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a237e', mb: 0.5 }}>
          ChickHealth Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
          Hệ thống giám sát và chẩn đoán sức khỏe gia cầm AI
        </Typography>
      </Box>

      {/* Thẻ thống kê */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Lượt khám" value={stats?.total_diagnosis} icon={<AssessmentIcon />} color="#2979ff" bgColor="#e3f2fd" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Ca bệnh" value={stats?.sick_cases} icon={<VirusIcon />} color="#ff1744" bgColor="#ffebee" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Mẫu phân" value={stats?.total_fecal_analysis} icon={<HealthIcon />} color="#00c853" bgColor="#e8f5e9" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Kiểm tra đàn" value={stats?.total_detections} icon={<ChickenIcon />} color="#ff9100" bgColor="#fff3e0" /></Grid>
      </Grid>

      {/* Biểu đồ xu hướng */}
      <Box mb={4}>
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e', mb: 3 }}>
            Xu hướng dịch bệnh
          </Typography>
          <Box sx={{ height: 350, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2979ff" stopOpacity={0.2}/><stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20}} />
                <Area type="monotone" dataKey="visits" name="Tổng lượt khám" fill="url(#colorVisits)" stroke="#2979ff" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#2979ff' }} />
                <Bar dataKey="sick" name="Ca bệnh" fill="#ff1744" radius={[4, 4, 0, 0]} barSize={30} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Biểu đồ tròn */}
      <Box mb={4}>
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e', mb: 3, textAlign: 'center' }}>
            Phân bổ sức khỏe đàn
          </Typography>
          <Box sx={{ height: 400, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: 20}} />
              </PieChart>
            </ResponsiveContainer>
            <Box position="absolute" textAlign="center" sx={{ pointerEvents: 'none', top: '42%' }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a237e', lineHeight: 1 }}>
                {stats?.total_diagnosis || 0}
              </Typography>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12 }}>
                TỔNG MẪU
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
