import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer les erreurs quand l'utilisateur tape
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation basique
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires (*)');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Tentative d\'inscription...', formData);
      
      // Étape 1: Récupérer le token CSRF
      await api.get('/users/csrf/');
      console.log('✅ CSRF token obtenu');
      
      // Étape 2: Tentative d'inscription
      const response = await api.post('/users/register/', formData);
      console.log('✅ Réponse d\'inscription:', response.data);
      
      // Étape 3: Vérifier que l'utilisateur est bien connecté
      const userResponse = await api.get('/users/me/');
      console.log('✅ Utilisateur vérifié:', userResponse.data);
      
      // Appeler le callback de connexion
      onLogin(userResponse.data);
      
      // Redirection vers le dashboard
      navigate('/');
      
    } catch (error) {
      console.error('❌ Erreur d\'inscription détaillée:', error);
      
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response) {
        // Le serveur a répondu avec un statut d'erreur
        const serverError = error.response.data;
        
        if (typeof serverError === 'object') {
          // Gérer les erreurs de validation Django
          const errors = Object.values(serverError).flat();
          errorMessage = errors.join(', ');
        } else if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else if (serverError.detail) {
          errorMessage = serverError.detail;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Inscription à CampusBourses</h2>
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
            placeholder="Choisissez un nom d'utilisateur"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="votre@email.com"
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
            placeholder="Au moins 6 caractères"
            minLength="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="first_name">Prénom</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Votre prénom"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="last_name">Nom</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Votre nom"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone_number">Téléphone</label>
          <input
            type="text"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            disabled={loading}
            placeholder="+33 1 23 45 67 89"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date_of_birth">Date de naissance</label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span>Inscription en cours...</span>
              <div className="loading-spinner"></div>
            </>
          ) : (
            'S\'inscrire'
          )}
        </button>
      </form>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <p>Déjà un compte ? <a href="/login" style={{ color: '#4f46e5' }}>Se connecter</a></p>
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;