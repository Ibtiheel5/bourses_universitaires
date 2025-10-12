// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-premium-container">
      <div className="login-premium-background">
        <div className="login-premium-card">
          <div className="login-premium-header">
            <div className="login-premium-logo">
              <span className="login-premium-logo-icon">🎓</span>
              <h1>CampusBourses</h1>
            </div>
            <h2>Connexion à votre espace</h2>
            <p>Accédez à votre tableau de bord personnel</p>
          </div>

          {error && (
            <div className="login-premium-error">
              <div className="error-icon">⚠️</div>
              <div className="error-message">{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-premium-form">
            <div className="form-group-premium">
              <label htmlFor="username" className="form-label-premium">
                <span className="label-icon">👤</span>
                Nom d'utilisateur
              </label>
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
                className="form-input-premium"
              />
            </div>
            
            <div className="form-group-premium">
              <label htmlFor="password" className="form-label-premium">
                <span className="label-icon">🔒</span>
                Mot de passe
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Entrez votre mot de passe"
                  minLength="6"
                  autoComplete="current-password"
                  className="form-input-premium"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Se souvenir de moi
              </label>
              <a href="/forgot-password" className="forgot-password">
                Mot de passe oublié ?
              </a>
            </div>
            
            <button 
              type="submit" 
              className={`login-premium-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </form>
          
          <div className="login-premium-footer">
            <p className="signup-prompt">
              Pas encore de compte ?{' '}
              <Link to="/register" className="signup-link">
                Créer un compte
              </Link>
            </p>
            
            <div className="login-premium-features">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Accès rapide</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Sécurisé</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Personnalisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;