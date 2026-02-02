import { Typography, Grid, Paper, Box, CircularProgress, Alert, Card, CardContent, Container } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FlashOn as TokenIcon, 
  QueryStats as RequestIcon, 
  Layers as FeatureIcon,
  Timeline as TrendIcon
} from '@mui/icons-material';
import { adminApi } from '../services/api';

const COLORS = ['#6200ea', '#00c853', '#ff9100', '#f44336', '#00b8d4'];

const AIUsage = () => {
  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const response = await adminApi.getUsageStats();
      return response.data;
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Không thể tải thống kê sử dụng</Alert>;

  const StatCard = ({ title, value, icon, gradient, color }: any) => (
    <Card sx={{
      height: '100%',
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      border: 'none',
      background: gradient,
      boxShadow: `0 4px 15px ${color}20`,
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${color}30` }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', letterSpacing: 1.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>
              {value?.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex' }}>
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
          AI Usage Analytics
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
          Giám sát tài nguyên hệ thống AI ChickHealth
        </Typography>
      </Box>

      {/* 1. Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <StatCard title="TỔNG TOKENS" value={usage?.total_tokens} icon={<TokenIcon />} color="#6200ea" gradient="linear-gradient(135deg, #6200ea 0%, #311b92 100%)" />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard title="TỔNG REQUESTS" value={usage?.total_requests} icon={<RequestIcon />} color="#00c853" gradient="linear-gradient(135deg, #00c853 0%, #00600f 100%)" />
        </Grid>
      </Grid>

      {/* 2. Biểu đồ xu hướng - Rộng ngang nhưng chiều cao vừa phải */}
      <Box mb={4}>
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <TrendIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a237e' }}>
              Tiêu thụ Token theo ngày
            </Typography>
          </Box>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage?.daily_usage}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6200ea" stopOpacity={0.2}/><stop offset="95%" stopColor="#6200ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#6200ea" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#6200ea' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* 3. Biểu đồ phân bổ - Rộng ngang nhưng Donut vừa vặn */}
      <Box mb={2}>
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2} justifyContent="center">
            <FeatureIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a237e' }}>
              Tỷ lệ tính năng sử dụng
            </Typography>
          </Box>
          <Box sx={{ height: 350, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usage?.feature_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {usage?.feature_distribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{paddingTop: 20, fontSize: 13}} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AIUsage;
