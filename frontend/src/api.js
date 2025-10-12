import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes timeout
});

// Fonction pour récupérer le token CSRF depuis les cookies
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

// Intercepteur pour ajouter le token CSRF aux requêtes
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCSRFToken();
    
    // Ajouter CSRF token aux requêtes modifiantes
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('CSRF token manquant');
      }
    }

    return config;
  },
  (error) => {
    console.error('Erreur intercepteur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Erreur API:', error.response?.status, error.message);
    
    // Ne pas rediriger automatiquement pour les erreurs 401/403
    // Laisser l'application gérer ces cas
    if (error.response?.status === 500) {
      console.error('Erreur serveur 500');
    }
    
    return Promise.reject(error);
  }
);

export default api;