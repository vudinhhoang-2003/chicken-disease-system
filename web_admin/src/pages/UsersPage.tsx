import { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, 
  CircularProgress, Box, Avatar, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { adminApi } from '../services/api';
import { InputAdornment } from '@mui/material';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    setShowPassword(false); // Reset show password
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '', // Không hiển thị password cũ
        full_name: user.full_name || '',
        is_active: user.is_active,
        is_superuser: user.is_superuser
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        is_active: true,
        is_superuser: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Update
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password; // Không gửi password nếu để trống
        await adminApi.updateUser(editingUser.id, updateData);
        setNotification({ message: 'Cập nhật thành công', type: 'success' });
      } else {
        // Create
        if (!formData.email || !formData.password) {
            setNotification({ message: 'Email và mật khẩu là bắt buộc', type: 'error' });
            return;
        }
        await adminApi.createUser(formData);
        setNotification({ message: 'Tạo người dùng thành công', type: 'success' });
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error: any) {
      setNotification({ 
        message: error.response?.data?.detail || 'Có lỗi xảy ra', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await adminApi.deleteUser(id);
        setNotification({ message: 'Đã xóa người dùng', type: 'success' });
        fetchUsers();
      } catch (error: any) {
        setNotification({ 
            message: error.response?.data?.detail || 'Lỗi khi xóa', 
            type: 'error' 
        });
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Quản lý Người dùng
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm người dùng
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar>{user.full_name ? user.full_name.charAt(0) : 'U'}</Avatar>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name || 'Chưa cập nhật'}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.is_superuser ? 'Admin' : 'Nông dân'} 
                    color={user.is_superuser ? 'secondary' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.is_active ? 'Hoạt động' : 'Bị khóa'} 
                    color={user.is_active ? 'success' : 'error'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={!!editingUser} // Không cho sửa email khi edit
          />
          <TextField
            margin="dense"
            label={editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
            type={showPassword ? "text" : "password"}
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Họ và tên"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
              }
              label="Trạng thái hoạt động"
            />
             <FormControlLabel
              control={
                <Switch
                  checked={formData.is_superuser}
                  onChange={(e) => setFormData({...formData, is_superuser: e.target.checked})}
                />
              }
              label="Quyền Admin"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={4000} 
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification?.type} onClose={() => setNotification(null)}>
            {notification?.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UsersPage;