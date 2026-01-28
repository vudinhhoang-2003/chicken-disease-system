import { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, 
  IconButton, Box, CircularProgress, Dialog,
  DialogTitle, DialogContent, TextField, DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  LocalPharmacy as MedicineIcon
} from '@mui/icons-material';
import { adminApi } from '../services/api';

interface Disease {
  id: number;
  code: string;
  name_vi: string;
  symptoms: string;
  cause: string;
  name_en?: string;
}

const KnowledgeBase = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name_vi: '',
    name_en: '',
    symptoms: '',
    cause: '',
    prevention: ''
  });

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDiseases();
      setDiseases(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bệnh:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa bệnh này không?')) {
      try {
        await adminApi.deleteDisease(id);
        fetchDiseases(); // Reload list
      } catch (error) {
        alert('Xóa thất bại');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({ code: '', name_vi: '', name_en: '', symptoms: '', cause: '', prevention: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (disease: Disease) => {
    setEditId(disease.id);
    setFormData({
      code: disease.code,
      name_vi: disease.name_vi,
      name_en: disease.name_en || '',
      symptoms: disease.symptoms,
      cause: disease.cause,
      prevention: '' // API hiện tại chưa trả về prevention trong list, cần gọi detail nếu muốn đầy đủ, tạm thời để trống hoặc update model list
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        // Update
        const payload = {
          name_vi: formData.name_vi,
          name_en: formData.name_en,
          symptoms: formData.symptoms,
          cause: formData.cause,
          prevention: formData.prevention
        };
        await adminApi.updateDisease(editId, payload);
      } else {
        // Create
        const payload = {
          ...formData,
          treatment_steps: [] 
        };
        await adminApi.createDisease(payload);
      }
      
      setOpenDialog(false);
      fetchDiseases();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Thao tác thất bại. Vui lòng thử lại.';
      alert(message);
    }
  };

  if (loading) {
     return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Cơ sở dữ liệu bệnh học</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Thêm bệnh mới
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Tên bệnh (TV)</TableCell>
              <TableCell>Triệu chứng sơ lược</TableCell>
              <TableCell>Nguyên nhân</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {diseases.map((disease) => (
              <TableRow key={disease.id}>
                <TableCell>{disease.code}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{disease.name_vi}</Typography>
                  <Typography variant="caption" color="textSecondary">{disease.name_en}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {disease.symptoms}
                </TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {disease.cause}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(disease)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(disease.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
             {diseases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Chưa có dữ liệu bệnh.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Cập nhật thông tin bệnh' : 'Thêm bệnh mới'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box display="flex" gap={2}>
               <TextField 
                label="Mã bệnh (VD: DIS_01)" 
                fullWidth 
                required 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                disabled={!!editId} // Không cho sửa mã khi edit
              />
               <TextField 
                label="Tên tiếng Anh" 
                fullWidth 
                value={formData.name_en}
                onChange={(e) => setFormData({...formData, name_en: e.target.value})}
              />
            </Box>
            <TextField 
              label="Tên bệnh (Tiếng Việt)" 
              fullWidth 
              required 
              value={formData.name_vi}
              onChange={(e) => setFormData({...formData, name_vi: e.target.value})}
            />
            <TextField 
              label="Triệu chứng" 
              fullWidth 
              multiline 
              rows={3} 
              required 
              value={formData.symptoms}
              onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
            />
            <TextField 
              label="Nguyên nhân" 
              fullWidth 
              multiline 
              rows={2} 
              required 
              value={formData.cause}
              onChange={(e) => setFormData({...formData, cause: e.target.value})}
            />
             <TextField 
              label="Cách phòng ngừa" 
              fullWidth 
              multiline 
              rows={2} 
              value={formData.prevention}
              onChange={(e) => setFormData({...formData, prevention: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default KnowledgeBase;
