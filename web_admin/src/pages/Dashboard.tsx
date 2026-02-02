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

  const StatCard = ({ title, value, icon, color, gradient }: any) => (
    <Card sx={{
      height: '100%',
      borderRadius: 5,
      position: 'relative',
      overflow: 'hidden',
      border: 'none',
      background: gradient,
      boxShadow: `0 10px 25px ${color}30`,
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'translateY(-8px)', boxShadow: `0 15px 35px ${color}50` }
    }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1.5 }}>
              {title}
            </Typography>
            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, mt: 0.5, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 2, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(10px)',
            color: '#fff',
            display: 'flex',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
      {/* Decorative Wave/Circle */}
      <Box sx={{
        position: 'absolute', bottom: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.1)', zIndex: 0
      }} />
    </Card>
  );

  return (
    <Container maxWidth={false} sx={{ py: 4, bgcolor: '#f8f9fc', minHeight: '100vh' }}>
      <Box mb={5}>
        <Typography variant="h3" sx={{ fontWeight: 950, color: '#1a237e', mb: 1, letterSpacing: -1 }}>
          ChickHealth
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
          Hệ thống giám sát và chẩn đoán sức khỏe gia cầm AI
        </Typography>
      </Box>

      {/* 1. Thẻ thống kê nâng cấp */}
      <Grid container spacing={3} mb={6}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Lượt khám" 
            value={stats?.total_diagnosis} 
            icon={<AssessmentIcon sx={{fontSize: 35}} />} 
            color="#2979ff" 
            gradient="linear-gradient(135deg, #2979ff 0%, #004ba0 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Ca bệnh" 
            value={stats?.sick_cases} 
            icon={<VirusIcon sx={{fontSize: 35}} />} 
            color="#ff1744" 
            gradient="linear-gradient(135deg, #ff1744 0%, #b20000 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Mẫu phân" 
            value={stats?.total_fecal_analysis} 
            icon={<HealthIcon sx={{fontSize: 35}} />} 
            color="#00c853" 
            gradient="linear-gradient(135deg, #00c853 0%, #00600f 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Kiểm tra đàn" 
            value={stats?.total_detections} 
            icon={<ChickenIcon sx={{fontSize: 35}} />} 
            color="#ff9100" 
            gradient="linear-gradient(135deg, #ff9100 0%, #b35d00 100%)" 
          />
        </Grid>
      </Grid>

      {/* 2. Biểu đồ xu hướng */}
      <Box mb={6}>
        <Paper sx={{ p: 4, borderRadius: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a237e', mb: 4 }}>
            Xu hướng dịch bệnh
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2979ff" stopOpacity={0.2}/><stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20, fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="visits" name="Tổng lượt khám" fill="url(#colorVisits)" stroke="#2979ff" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#2979ff' }} />
                <Bar dataKey="sick" name="Ca bệnh" fill="#ff1744" radius={[6, 6, 0, 0]} barSize={45} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* 3. Biểu đồ tròn */}
      <Box mb={4}>
        <Paper sx={{ p: 4, borderRadius: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a237e', mb: 4, textAlign: 'center' }}>
            Phân bổ sức khỏe đàn
          </Typography>
          <Box sx={{ height: 450, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={150}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: 30, fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
            <Box position="absolute" textAlign="center" sx={{ pointerEvents: 'none', top: '42%' }}>
              <Typography variant="h3" sx={{ fontWeight: 950, color: '#1a237e', lineHeight: 1 }}>
                {stats?.total_diagnosis || 0}
              </Typography>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>
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