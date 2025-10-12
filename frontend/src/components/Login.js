import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Tentative de connexion...');
      
      // S'assurer d'avoir un token CSRF
      try {
        await api.get('/users/csrf/');
        console.log('✅ CSRF token obtenu');
      } catch (csrfError) {
        console.log('⚠️ CSRF non disponible, continuation...');
      }
      
      // Tentative de connexion
      const response = await api.post('/users/login/', formData);
      console.log('✅ Réponse de connexion reçue');
      
      // Vérifier que l'utilisateur est bien connecté
      const userResponse = await api.get('/users/me/');
      console.log('✅ Utilisateur vérifié:', userResponse.data);
      
      // Appeler le callback de connexion
      onLogin(userResponse.data);
      
      // Redirection vers le dashboard
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error.response) {
        const serverError = error.response.data;
        
        if (serverError.error) {
          errorMessage = serverError.error;
        } else if (serverError.detail) {
          errorMessage = serverError.detail;
        } else if (typeof serverError === 'object') {
          const errors = Object.values(serverError).flat();
          errorMessage = errors.join(', ');
        } else if (typeof serverError === 'string') {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur Django est démarré.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Connexion à CampusBourses</h2>
      
      {error && (
        <div className="alert alert-error">
          <strong>Erreur:</strong> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Entrez votre nom d'utilisateur"
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mot de passe *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Entrez votre mot de passe"
            minLength="6"
            autoComplete="current-password"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span>Connexion en cours...</span>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginLeft: '8px'
              }}></div>
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Pas de compte ?{' '}
          <a 
            href="/register" 
            style={{ 
              color: '#4f46e5', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            S'inscrire
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;