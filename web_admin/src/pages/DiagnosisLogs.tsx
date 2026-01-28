import { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, 
  CircularProgress, Box, IconButton, Dialog
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { adminApi } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DiagnosisLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await adminApi.getRecentLogs();
        setLogs(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
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
      <Typography variant="h5" gutterBottom>
        Lịch sử chẩn đoán
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Thời gian</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Kết quả AI</TableCell>
              <TableCell>Độ tin cậy</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ảnh</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(log.created_at)}</TableCell>
                <TableCell>
                  <Chip label={log.type} size="small" variant="outlined" color={log.type === 'Phân' ? 'primary' : 'secondary'} />
                </TableCell>
                <TableCell>{log.result}</TableCell>
                <TableCell>
                  {log.confidence > 0 ? `${(log.confidence * 100).toFixed(1)}%` : '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={log.status} 
                    color={log.status === 'Hoàn thành' || log.status === 'Bình thường' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => setSelectedImage(`${API_BASE_URL}${log.image_url}`)}>
                    <VisibilityIcon color="primary" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Chưa có dữ liệu chẩn đoán.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog xem ảnh phóng to */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="md">
        <Box p={1}>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Chẩn đoán" 
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          )}
        </Box>
      </Dialog>
    </Paper>
  );
};

export default DiagnosisLogs;
