import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

const DiagnosisLogs = () => {
  // Dữ liệu mẫu
  const logs = [
    { id: 1, date: '2026-01-26 10:00', type: 'Phân', result: 'Coccidiosis', confidence: 0.95, status: 'Đã xác nhận' },
    { id: 2, date: '2026-01-26 10:30', type: 'Hành vi', result: 'Khỏe mạnh', confidence: 0.88, status: 'Chờ duyệt' },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Lịch sử chẩn đoán
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Kết quả AI</TableCell>
              <TableCell>Độ tin cậy</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.id}</TableCell>
                <TableCell>{log.date}</TableCell>
                <TableCell>{log.type}</TableCell>
                <TableCell>{log.result}</TableCell>
                <TableCell>{(log.confidence * 100).toFixed(1)}%</TableCell>
                <TableCell>
                  <Chip 
                    label={log.status} 
                    color={log.status === 'Đã xác nhận' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DiagnosisLogs;
