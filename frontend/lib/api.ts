import axios from 'axios';

// API Base URL - Set NEXT_PUBLIC_API_URL in environment variables
// For production: https://hesabdonibackend.liara.run/api
// For local development: http://localhost:5001/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Get backend base URL (without /api) for file URLs
export const getBackendBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    return apiUrl.replace('/api', '');
  }
  // Client-side: get from current API base URL
  return API_BASE_URL.replace('/api', '');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

