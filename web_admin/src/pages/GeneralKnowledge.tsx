import { useEffect, useState } from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  IconButton, Box, CircularProgress, Dialog,
  DialogTitle, DialogContent, TextField, DialogActions,
  Chip, Tooltip, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { adminApi } from '../services/api';

interface Knowledge {
  id: number;
  category: string;
  title: string;
  content: string;
  source?: string;
  sync_status: 'PENDING' | 'SUCCESS' | 'ERROR';
  sync_error?: string;
}

const DEFAULT_CATEGORIES = [
  "Chuồng trại & Môi trường",
  "Dinh dưỡng & Thức ăn",
  "Con giống & Ấp nở",
  "Quy trình phòng bệnh",
  "Kỹ thuật chăn nuôi khác"
];

const GeneralKnowledge = () => {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    source: ''
  });

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getGeneralKnowledge();
      setKnowledgeList(response.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const getCategoryOptions = () => {
    const existingCategories = knowledgeList.map(k => k.category);
    const all = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));
    return all.sort();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa kiến thức này không?')) {
      try {
        await adminApi.deleteGeneralKnowledge(id);
        fetchKnowledge();
      } catch (error) {
        alert('Xóa thất bại');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({ category: DEFAULT_CATEGORIES[0], title: '', content: '', source: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: Knowledge) => {
    setEditId(item.id);
    setFormData({
      category: item.category,
      title: item.title,
      content: item.content,
      source: item.source || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...formData };
      if (editId) {
        await adminApi.updateGeneralKnowledge(editId, payload);
      } else {
        await adminApi.createGeneralKnowledge(payload);
      }
      setOpenDialog(false);
      fetchKnowledge();
    } catch (error: any) {
      alert('Thao tác thất bại');
    }
  };

  const renderSyncStatus = (item: Knowledge) => {
    switch (item.sync_status) {
      case 'SUCCESS':
        return (
          <Tooltip title="Đã đồng bộ AI">
            <Chip icon={<SuccessIcon />} label="Đã đồng bộ" color="success" size="small" variant="outlined" />
          </Tooltip>
        );
      case 'ERROR':
        return (
          <Tooltip title={item.sync_error}>
            <Chip icon={<ErrorIcon />} label="Lỗi" color="error" size="small" variant="outlined" />
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Đang xử lý...">
            <Chip icon={<PendingIcon />} label="Đang xử lý" color="warning" size="small" variant="outlined" />
          </Tooltip>
        );
    }
  };

  if (loading) {
    return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5">Kiến thức chăn nuôi chung</Typography>
          <IconButton size="small" onClick={fetchKnowledge}><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Thêm kiến thức mới
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Danh mục</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Nội dung tóm tắt</TableCell>
              <TableCell>Trạng thái AI</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {knowledgeList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Chip label={item.category} size="small" />
                </TableCell>
                <TableCell style={{ fontWeight: 500 }}>{item.title}</TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.content}
                </TableCell>
                <TableCell>{renderSyncStatus(item)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {knowledgeList.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">Chưa có dữ liệu.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Cập nhật kiến thức' : 'Thêm kiến thức mới'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              freeSolo
              options={getCategoryOptions()}
              value={formData.category}
              onChange={(_, newValue) => {
                setFormData({ ...formData, category: newValue || '' });
              }}
              onInputChange={(_, newInputValue) => {
                setFormData({ ...formData, category: newInputValue });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Danh mục (Chọn hoặc gõ mới)" required fullWidth />
              )}
            />
            <TextField
              label="Tiêu đề"
              fullWidth required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Nội dung chi tiết"
              fullWidth multiline rows={6} required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <TextField
              label="Nguồn tham khảo"
              fullWidth
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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

export default GeneralKnowledge;