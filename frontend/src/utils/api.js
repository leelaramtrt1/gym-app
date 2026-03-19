import axios from 'axios';

// Get the current hostname (e.g., 10.138.191.237 or localhost)
const hostname = window.location.hostname;
// RELATIVE PATH: Used when frontend is served by the backend
const baseURL = "/api";

const api = axios.create({
  baseURL,
});

// Add Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
