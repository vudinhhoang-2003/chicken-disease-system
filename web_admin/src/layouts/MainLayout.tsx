import React, { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, 
  Divider, IconButton, ListItemButton, ListItemIcon, 
  ListItemText, Avatar, useTheme, useMediaQuery, 
  Container
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  History as HistoryIcon, 
  Psychology as PsychologyIcon, 
  People as PeopleIcon, 
  Logout as LogoutIcon, 
  School as SchoolIcon, 
  SettingsSuggest as ConfigIcon, 
  BarChart as UsageIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 280;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Tổng quan', icon: <DashboardIcon />, path: '/' },
    { text: 'Lịch sử chẩn đoán', icon: <HistoryIcon />, path: '/logs' },
    { text: 'Bệnh học & Phác đồ', icon: <PsychologyIcon />, path: '/knowledge' },
    { text: 'Kiến thức chung', icon: <SchoolIcon />, path: '/general-knowledge' },
    { text: 'Người dùng', icon: <PeopleIcon />, path: '/users' },
    { text: 'Cấu hình AI', icon: <ConfigIcon />, path: '/ai-settings' },
    { text: 'Thống kê AI', icon: <UsageIcon />, path: '/ai-usage' },
  ];

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)', 
      color: '#fff' 
    }}>
      {/* Logo Area */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, height: 40, borderRadius: '12px', bgcolor: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <img src="/favicon.png" alt="Logo" style={{ width: 28, height: 28 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5, color: '#fff' }}>
          CHICKHEALTH
        </Typography>
      </Box>

      {/* User Card */}
      <Box sx={{ mb: 3, mx: 2.5 }}>
        <Box 
          sx={{ 
            display: 'flex', alignItems: 'center', p: 2, borderRadius: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.08)', gap: 2 
          }}
        >
          <Avatar 
            src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2e7d32&color=fff`} 
            alt="User" 
          />
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
              {user?.name || 'Admin'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Quản trị viên
            </Typography>
          </Box>
        </Box>
      </Box>

      <List component="nav" sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (!isDesktop) setMobileOpen(false);
              }}
              sx={{
                mb: 0.5,
                py: 1.5,
                px: 2.5,
                borderRadius: 1.5,
                bgcolor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: active ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 40, 
                  color: active ? '#4caf50' : 'inherit' 
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: 14, 
                  fontWeight: active ? 600 : 500 
                }} 
              />
            </ListItemButton>
          );
        })}
      </List>
      
      <Box sx={{ p: 2 }}>
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            borderRadius: 1.5, 
            color: '#ffcdd2',
            '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.12)' }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Đăng xuất" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Top App Bar (Only for Mobile or when collapsed) */}
      {!isDesktop && (
        <AppBar position="fixed" sx={{ bgcolor: '#fff', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid #f0f0f0' }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              CHICKHEALTH
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              border: 'none',
              boxShadow: '4px 0 24px 0 rgba(0,0,0,0.02)'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 8, lg: 0 },
          bgcolor: '#f8f9fc',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
