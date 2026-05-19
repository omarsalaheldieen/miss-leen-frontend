import axios from 'axios';

// baseURL is set globally in main.jsx via axios.defaults.baseURL
// This client just adds the JWT interceptor on top.
const client = axios.create();

client.interceptors.request.use((config) => {
  // Prepend /api if the URL doesn't already have a full host
  if (config.url && !config.url.startsWith('http')) {
    const base = axios.defaults.baseURL || '';
    config.baseURL = base;
  }
  const token = localStorage.getItem('ml_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ml_token');
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default client;
