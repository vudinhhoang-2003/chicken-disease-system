import { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, 
  IconButton, Box, CircularProgress, Dialog,
  DialogTitle, DialogContent, TextField, DialogActions,
  Chip, Tooltip, Divider
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

interface Medicine {
  name: string;
  active_ingredient?: string;
  dosage: string;
}

interface TreatmentStep {
  step_order: number;
  description: string;
  action?: string;
  medicines: Medicine[];
}

interface Disease {
  id: number;
  code: string;
  name_vi: string;
  symptoms: string;
  cause: string;
  prevention?: string;
  name_en?: string;
  source?: string;
  sync_status: 'PENDING' | 'SUCCESS' | 'ERROR';
  sync_error?: string;
  treatment_steps: TreatmentStep[];
}

const KnowledgeBase = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name_vi: string;
    name_en: string;
    symptoms: string;
    cause: string;
    prevention: string;
    source: string;
    treatment_steps: TreatmentStep[];
  }>({
    code: '',
    name_vi: '',
    name_en: '',
    symptoms: '',
    cause: '',
    prevention: '',
    source: '',
    treatment_steps: []
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
    setFormData({ 
      code: '', 
      name_vi: '', 
      name_en: '', 
      symptoms: '', 
      cause: '', 
      prevention: '', 
      source: '',
      treatment_steps: [] 
    });
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
      prevention: disease.prevention || '',
      source: disease.source || '',
      treatment_steps: disease.treatment_steps || []
    });
    setOpenDialog(true);
  };

  const addStep = () => {
    const newStep: TreatmentStep = {
      step_order: formData.treatment_steps.length + 1,
      description: '',
      medicines: []
    };
    setFormData({ ...formData, treatment_steps: [...formData.treatment_steps, newStep] });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.treatment_steps.filter((_, i) => i !== index);
    // Cập nhật lại số thứ tự bước
    const updatedSteps = newSteps.map((s, i) => ({ ...s, step_order: i + 1 }));
    setFormData({ ...formData, treatment_steps: updatedSteps });
  };

  const addMedicine = (stepIndex: number) => {
    const newSteps = [...formData.treatment_steps];
    newSteps[stepIndex].medicines.push({ name: '', dosage: '', active_ingredient: '' });
    setFormData({ ...formData, treatment_steps: newSteps });
  };

  const removeMedicine = (stepIndex: number, medIndex: number) => {
    const newSteps = [...formData.treatment_steps];
    newSteps[stepIndex].medicines = newSteps[stepIndex].medicines.filter((_, i) => i !== medIndex);
    setFormData({ ...formData, treatment_steps: newSteps });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        code: formData.code,
        name_vi: formData.name_vi,
        name_en: formData.name_en,
        symptoms: formData.symptoms,
        cause: formData.cause,
        prevention: formData.prevention,
        source: formData.source,
        treatment_steps: formData.treatment_steps.map(step => ({
          step_order: step.step_order,
          description: step.description,
          medicines: step.medicines.map(med => ({
            name: med.name,
            dosage: med.dosage,
            active_ingredient: med.active_ingredient || ''
          }))
        }))
      };

      if (editId) {
        await adminApi.updateDisease(editId, payload);
      } else {
        await adminApi.createDisease(payload);
      }
      
      setOpenDialog(false);
      fetchDiseases();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Thao tác thất bại. Vui lòng thử lại.';
      alert(message);
    }
  };

  const renderSyncStatus = (disease: Disease) => {
    switch (disease.sync_status) {
      case 'SUCCESS':
        return (
          <Tooltip title="Đã đồng bộ với Vector DB">
            <Chip 
              icon={<SuccessIcon />} 
              label="Đã đồng bộ" 
              color="success" 
              size="small" 
              variant="outlined" 
            />
          </Tooltip>
        );
      case 'ERROR':
        return (
          <Tooltip title={disease.sync_error || "Lỗi đồng bộ không xác định"}>
            <Chip 
              icon={<ErrorIcon />} 
              label="Lỗi" 
              color="error" 
              size="small" 
              variant="outlined" 
            />
          </Tooltip>
        );
      case 'PENDING':
      default:
        return (
          <Tooltip title="Đang trong hàng đợi đồng bộ...">
            <Chip 
              icon={<PendingIcon />} 
              label="Đang xử lý" 
              color="warning" 
              size="small" 
              variant="outlined" 
            />
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
          <Typography variant="h5">Cơ sở dữ liệu bệnh học</Typography>
          <IconButton size="small" onClick={fetchDiseases} title="Làm mới">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
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
              <TableCell>Trạng thái AI</TableCell>
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
                <TableCell>
                  {renderSyncStatus(disease)}
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
            <TextField 
              label="Nguồn tài liệu tham khảo" 
              fullWidth 
              value={formData.source}
              placeholder="VD: Giáo trình Bệnh Gia cầm - ĐH Nông Lâm"
              onChange={(e) => setFormData({...formData, source: e.target.value})}
            />

            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" color="primary">Phác đồ điều trị chi tiết</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addStep} variant="outlined">
                Thêm bước
              </Button>
            </Box>

            {formData.treatment_steps.map((step, sIdx) => (
              <Paper key={sIdx} variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', position: 'relative' }}>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => removeStep(sIdx)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                <Typography variant="subtitle2" gutterBottom color="secondary">
                  Bước {step.step_order}
                </Typography>
                
                <TextField 
                  label="Mô tả bước này" 
                  fullWidth 
                  multiline 
                  rows={2} 
                  value={step.description}
                  onChange={(e) => {
                    const newSteps = [...formData.treatment_steps];
                    newSteps[sIdx].description = e.target.value;
                    setFormData({...formData, treatment_steps: newSteps});
                  }}
                  sx={{ mb: 2, bgcolor: '#fff' }}
                />

                <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight="bold">Danh mục thuốc gợi ý:</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addMedicine(sIdx)}>Thêm thuốc</Button>
                </Box>

                {step.medicines.map((med, mIdx) => (
                  <Box key={mIdx} display="flex" gap={1} mb={1} alignItems="center">
                    <TextField 
                      label="Tên thuốc" size="small" sx={{ flex: 2, bgcolor: '#fff' }}
                      value={med.name}
                      onChange={(e) => {
                        const newSteps = [...formData.treatment_steps];
                        newSteps[sIdx].medicines[mIdx].name = e.target.value;
                        setFormData({...formData, treatment_steps: newSteps});
                      }}
                    />
                    <TextField 
                      label="Liều dùng" size="small" sx={{ flex: 3, bgcolor: '#fff' }}
                      value={med.dosage}
                      onChange={(e) => {
                        const newSteps = [...formData.treatment_steps];
                        newSteps[sIdx].medicines[mIdx].dosage = e.target.value;
                        setFormData({...formData, treatment_steps: newSteps});
                      }}
                    />
                    <IconButton size="small" color="error" onClick={() => removeMedicine(sIdx, mIdx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Paper>
            ))}
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
