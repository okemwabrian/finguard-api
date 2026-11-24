import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error;

    if (status === 403 && errorCode === 'PASSWORD_CHANGE_REQUIRED') {
      window.location.href = '/change-password';
    } else if (status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('finguard_token');
      localStorage.removeItem('finguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
