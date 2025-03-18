import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Configurer l'intercepteur pour ajouter le token d'authentification
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter le token à toutes les requêtes authentifiées
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
    getTikTokAuthUrl: async () => {
        const response = await api.get('/auth/tiktok');
        return response.data.authUrl;
      },
    
      // S'authentifier avec TikTok
      loginWithTikTok: async (code) => {
        const response = await api.post('/auth/tiktok/callback', { code });
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
      },
  register: async (userData) => {
    const response = await api.post('/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Récupérer le profil complet de l'utilisateur depuis le serveur
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Mettre à jour le département de l'utilisateur
  updateDepartment: async (departmentData) => {
    const response = await api.put('/user/department', departmentData);
    
    // Mettre à jour les données de l'utilisateur dans le localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }
};

export default api;