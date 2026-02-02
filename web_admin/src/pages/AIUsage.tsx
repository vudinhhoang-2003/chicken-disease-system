import { Typography, Grid, Paper, Box, CircularProgress, Alert, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FlashOn as TokenIcon, 
  QueryStats as RequestIcon, 
  DonutLarge as DistributionIcon 
} from '@mui/icons-material';
import { adminApi } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  return (
    <Box sx={{ pb: 5 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">Thống kê sử dụng AI</Typography>
        <Typography variant="body1" color="textSecondary">Theo dõi lưu lượng truy cập và tiêu thụ tài nguyên</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1a237e', color: '#fff', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <TokenIcon sx={{ fontSize: 50, opacity: 0.5, mr: 2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>TỔNG TOKENS TIÊU THỤ</Typography>
                <Typography variant="h3" fontWeight="bold">{usage?.total_tokens?.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#2e7d32', color: '#fff', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <RequestIcon sx={{ fontSize: 50, opacity: 0.5, mr: 2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>TỔNG LƯỢT YÊU CẦU (REQUESTS)</Typography>
                <Typography variant="h3" fontWeight="bold">{usage?.total_requests?.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Daily Token Usage Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 5, height: 450 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Xu hướng tiêu thụ Token (7 ngày)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={usage?.daily_usage}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#8884d8" fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Feature Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: 5, height: 450, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Phân bổ theo tính năng</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usage?.feature_distribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {usage?.feature_distribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIUsage;
