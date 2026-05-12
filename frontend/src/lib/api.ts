import axios from 'axios';

const API_URL = 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  try {
    const authData = localStorage.getItem('sterling-auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    // Silent catch if localStorage is not available (e.g. during SSR)
  }
  return config;
});

export default api;
