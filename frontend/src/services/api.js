import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citymind_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const eventService = {
  list: (params) => api.get('/events/', { params }).then((res) => res.data),
  process: (payload) => api.post('/events/process', payload).then((res) => res.data.data),
  classify: (text) => api.post('/classify', { text }).then((res) => res.data),
  summarize: (texts) => api.post('/summarize', { texts }).then((res) => res.data),
  cluster: (texts, algorithm = 'dbscan') => api.post('/cluster', { texts, algorithm }).then((res) => res.data),
  extract: (text) => api.post('/extract', { text }).then((res) => res.data),
};

export const analyticsService = {
  overview: () => api.get('/analytics/').then((res) => res.data),
  trends: () => api.get('/analytics/trends').then((res) => res.data),
  trending: (neighborhood) => api.get('/analytics/trending', { params: { neighborhood } }).then((res) => res.data),
};

export const authService = {
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
};

export const monitoringService = {
  health: () => api.get('/monitoring/health').then((res) => res.data),
  simulate: () => api.post('/monitoring/simulate').then((res) => res.data),
};
