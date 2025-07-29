// API Configuration for different environments

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API endpoints configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      me: '/api/auth/me'
    },
    users: {
      profile: '/api/users/profile',
      update: '/api/users/update'
    },
    ecodex: {
      identify: '/api/ecodex/identify',
      entries: '/api/ecodex/entries',
      stats: '/api/ecodex/stats',
      chat: '/api/ecodex/chat'
    }
  },
  timeout: 30000, // 30 seconds timeout for image uploads
  headers: {
    'Content-Type': 'application/json'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Helper function for axios configuration
export const getAxiosConfig = (includeAuth = true) => {
  const config = {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: { ...API_CONFIG.headers }
  };

  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
  }

  return config;
};

export default API_CONFIG;