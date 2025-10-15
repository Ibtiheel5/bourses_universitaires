// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

api.interceptors.request.use(
  (config) => {
    const csrfToken = getCSRFToken();
    
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    console.error('Erreur intercepteur requête:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirection vers login gérée dans les composants
      console.log('Non authentifié - redirection nécessaire');
    } else if (error.response?.status === 403) {
      console.error('Accès refusé');
    } else if (error.response?.status === 500) {
      console.error('Erreur serveur 500');
    }
    
    return Promise.reject(error);
  }
);

export default api;