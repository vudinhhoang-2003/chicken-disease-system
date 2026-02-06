import { Typography, Grid, Paper, Box, CircularProgress, Alert, Card, CardContent, Container, useTheme, List } from '@mui/material';
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

const CHART_COLORS = ['#2e7d32', '#f57c00', '#00c853', '#ffa000', '#009624', '#ff6f00'];

const Dashboard = () => {
  const theme = useTheme();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress color="primary" /></Box>;
  if (error) return <Alert severity="error">Không thể tải dữ liệu thống kê</Alert>;

  const chartData = stats?.chart_data || [];
  const pieData = stats?.pie_data || [];

  const StatCard = ({ title, value, icon, color, gradient }: any) => (
    <Card sx={{
      height: '100%',
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      border: 'none',
      background: gradient,
      boxShadow: `0 8px 32px ${color}40`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 40px ${color}60` }
    }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: 'rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(8px)',
            color: '#fff',
            display: 'flex',
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
      {/* Decorative Circle */}
      <Box sx={{
        position: 'absolute', bottom: -20, right: -20,
        width: 140, height: 140, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0
      }} />
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <Box mb={4} sx={{ px: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1, letterSpacing: -0.5 }}>
          Tổng quan Hệ thống
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Giám sát sức khỏe đàn gà và hiệu suất AI thời gian thực
        </Typography>
      </Box>

      {/* 1. Thẻ thống kê */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="LƯỢT CHẨN ĐOÁN" 
            value={stats?.total_diagnosis} 
            icon={<AssessmentIcon sx={{fontSize: 32}} />} 
            color="#2e7d32" 
            gradient="linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="CẢNH BÁO BỆNH" 
            value={stats?.sick_cases} 
            icon={<VirusIcon sx={{fontSize: 32}} />} 
            color="#f57c00" 
            gradient="linear-gradient(135deg, #f57c00 0%, #e65100 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="MẪU PHÂN TÍCH" 
            value={stats?.total_fecal_analysis} 
            icon={<HealthIcon sx={{fontSize: 32}} />} 
            color="#00c853" 
            gradient="linear-gradient(135deg, #00c853 0%, #009624 100%)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="GIÁM SÁT ĐÀN" 
            value={stats?.total_detections} 
            icon={<ChickenIcon sx={{fontSize: 32}} />} 
            color="#0288d1" 
            gradient="linear-gradient(135deg, #0288d1 0%, #01579b 100%)" 
          />
        </Grid>
      </Grid>

      {/* 2. Biểu đồ xu hướng - FULL WIDTH */}
      <Box mb={4}>
        <Card sx={{ boxShadow: theme.shadows[10], width: '100%' }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, color: 'text.primary' }}>
              Xu hướng Bệnh & Khám bệnh (Thời gian thực)
            </Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.15}/><stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#637381', fontSize: 12, fontWeight: 600}} 
                    dy={10} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#919eab', fontSize: 12}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20, fontWeight: 600}} />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    name="Lượt khám" 
                    fill="url(#colorVisits)" 
                    stroke="#2e7d32" 
                    strokeWidth={3} 
                  />
                  <Bar 
                    dataKey="sick" 
                    name="Ca bệnh" 
                    fill="#f57c00" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* 3. Biểu đồ tròn - FULL WIDTH & FIXED */}
      <Box mb={4}>
        <Card sx={{ boxShadow: theme.shadows[10], width: '100%' }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 4 }}>
              Phân bổ Tỷ lệ Sức khỏe Đàn
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              {/* Biểu đồ */}
              <Box sx={{ width: { xs: '100%', md: '60%' }, height: 400, position: 'relative' }}>
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
                      nameKey="name"
                      stroke="none"
                      cornerRadius={10}
                    >
                      {pieData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <Box 
                  position="absolute" 
                  sx={{ 
                    top: '50%', left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    textAlign: 'center', pointerEvents: 'none' 
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
                    {stats?.total_diagnosis || 0}
                  </Typography>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>
                    TỔNG MẪU
                  </Typography>
                </Box>
              </Box>

              {/* Chú thích tùy chỉnh */}
              <Box sx={{ width: { xs: '100%', md: '40%' }, pl: { md: 6 }, mt: { xs: 4, md: 0 } }}>
                <List>
                  {pieData.map((entry: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Box 
                        sx={{ 
                          width: 16, height: 16, borderRadius: '4px', 
                          bgcolor: CHART_COLORS[index % CHART_COLORS.length], mr: 2,
                          boxShadow: `0 2px 4px ${CHART_COLORS[index % CHART_COLORS.length]}40`
                        }} 
                      />
                      <Typography variant="body1" sx={{ fontWeight: 600, flexGrow: 1, color: 'text.secondary' }}>
                        {entry.name}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {entry.value}
                      </Typography>
                    </Box>
                  ))}
                </List>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;