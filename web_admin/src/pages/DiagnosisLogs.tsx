import { useEffect, useState } from 'react';
import { 
  Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, 
  CircularProgress, Box, IconButton, Dialog, 
  Card, CardHeader, Avatar, Stack, Tooltip
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  BugReport as VirusIcon, 
  Pets as PetIcon,
  ImageNotSupported as NoImageIcon
} from '@mui/icons-material';
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
    const date = new Date(dateString);
    return (
      <Stack>
        <Typography variant="body2" fontWeight="600">{date.toLocaleDateString('vi-VN')}</Typography>
        <Typography variant="caption" color="text.secondary">{date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</Typography>
      </Stack>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Hoàn thành' || status === 'Bình thường') return 'success';
    if (status === 'Sick' || status === 'Nguy cơ' || status.includes('Coccidiosis') || status.includes('Salmonella') || status.includes('New Castle')) return 'error';
    return 'warning';
  };

  const getResultColor = (result: string) => {
    if (result === 'Healthy' || result === 'Bình thường') return 'success';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4, lg: 5 } }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" color="text.primary">
          Lịch sử Chẩn đoán
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Danh sách các lần chẩn đoán AI từ người dùng mobile
        </Typography>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Loại chẩn đoán</TableCell>
                <TableCell>Kết quả AI</TableCell>
                <TableCell align="center">Độ tin cậy</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hình ảnh</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, index) => {
                const imageUrl = log.image_url ? `${API_BASE_URL}${log.image_url}` : null;
                const isFecal = log.type === 'Phân' || log.type === 'diagnosis';
                
                return (
                  <TableRow key={index} hover>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar 
                          sx={{ 
                            bgcolor: isFecal ? 'primary.lighter' : 'secondary.lighter',
                            color: isFecal ? 'primary.main' : 'secondary.main',
                            width: 32, height: 32
                          }}
                        >
                          {isFecal ? <VirusIcon fontSize="small" /> : <PetIcon fontSize="small" />}
                        </Avatar>
                        <Typography variant="body2" fontWeight="600">
                          {isFecal ? 'Phân tích bệnh' : 'Giám sát đàn'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                       <Chip 
                        label={log.result} 
                        color={getResultColor(log.result)}
                        variant="soft" // Custom variant in theme if supported, else defaults
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box position="relative" display="inline-flex">
                        <CircularProgress 
                          variant="determinate" 
                          value={log.confidence * 100} 
                          size={30} 
                          thickness={5}
                          color={log.confidence > 0.8 ? 'success' : 'warning'}
                        />
                        <Box
                          top={0} left={0} bottom={0} right={0}
                          position="absolute" display="flex"
                          alignItems="center" justifyContent="center"
                        >
                          <Typography variant="caption" component="div" color="text.secondary" fontSize={8} fontWeight="bold">
                            {Math.round(log.confidence * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.status} 
                        color={getStatusColor(log.status)}
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {imageUrl ? (
                        <Tooltip title="Xem ảnh lớn">
                          <Avatar 
                            src={imageUrl} 
                            variant="rounded" 
                            sx={{ width: 48, height: 48, cursor: 'pointer', border: '1px solid #eee' }}
                            onClick={() => setSelectedImage(imageUrl)}
                          />
                        </Tooltip>
                      ) : (
                        <NoImageIcon color="disabled" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">Chưa có dữ liệu chẩn đoán.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog xem ảnh phóng to */}
      <Dialog 
        open={!!selectedImage} 
        onClose={() => setSelectedImage(null)} 
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2, overflow: 'hidden' }
        }}
      >
        <Box position="relative">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Chẩn đoán" 
              style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} 
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default DiagnosisLogs;
