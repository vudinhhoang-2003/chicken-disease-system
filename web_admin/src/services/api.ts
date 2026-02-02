import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Request Interceptor: Đính kèm token vào Header
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API

export const adminApi = {

  getStats: () => api.get('/admin/stats'),

  getRecentLogs: (limit = 20) => api.get(`/admin/recent-logs?limit=${limit}`),

  

  // Knowledge Base

  getDiseases: () => api.get('/admin/diseases'),

    getDisease: (id: number) => api.get(`/admin/diseases/${id}`),

    createDisease: (data: any) => api.post('/admin/diseases', data),

    updateDisease: (id: number, data: any) => api.put(`/admin/diseases/${id}`, data),

    deleteDisease: (id: number) => api.delete(`/admin/diseases/${id}`),

    // General Knowledge (Farming Guide)
    getGeneralKnowledge: () => api.get('/admin/knowledge'),
    createGeneralKnowledge: (data: any) => api.post('/admin/knowledge', data),
    updateGeneralKnowledge: (id: number, data: any) => api.put(`/admin/knowledge/${id}`, data),
    deleteGeneralKnowledge: (id: number) => api.delete(`/admin/knowledge/${id}`),

    // System Settings
    getSettings: () => api.get('/admin/settings'),
    updateSetting: (data: any) => api.post('/admin/settings', data),
    testAI: (data: any) => api.post('/admin/test-ai', data),
    getUsageStats: () => api.get('/admin/usage-stats'),

    // User Management
    getUsers: () => api.get('/admin/users'),
    createUser: (data: any) => api.post('/admin/users', data),
    updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  };

  



export default api;
