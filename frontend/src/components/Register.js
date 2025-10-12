// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Register.css';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!validateStep1()) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Tentative d\'inscription...', formData);
      
      // Étape 1: Récupérer le token CSRF
      await api.get('/users/csrf/');
      console.log('✅ CSRF token obtenu');
      
      // Préparer les données pour l'envoi
      const submitData = { ...formData };
      delete submitData.confirmPassword; // Retirer la confirmation du mot de passe
      
      // Étape 2: Tentative d'inscription
      const response = await api.post('/users/register/', submitData);
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
        const serverError = error.response.data;
        
        if (typeof serverError === 'object') {
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

  const steps = [
    { number: 1, title: 'Compte', active: currentStep === 1 },
    { number: 2, title: 'Profil', active: currentStep === 2 }
  ];

  return (
    <div className="register-premium-container">
      <div className="register-premium-background">
        <div className="register-premium-card">
          <div className="register-premium-header">
            <div className="register-premium-logo">
              <span className="register-premium-logo-icon">🎓</span>
              <h1>CampusBourses</h1>
            </div>
            <h2>Créer votre compte</h2>
            <p>Rejoignez notre plateforme de bourses universitaires</p>
          </div>

          {/* Progress Steps */}
          <div className="steps-container">
            {steps.map(step => (
              <div key={step.number} className={`step ${step.active ? 'active' : ''}`}>
                <div className="step-number">{step.number}</div>
                <span className="step-title">{step.title}</span>
              </div>
            ))}
            <div className="steps-line"></div>
          </div>

          {error && (
            <div className="register-premium-error">
              <div className="error-icon">⚠️</div>
              <div className="error-message">{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="register-premium-form">
            {currentStep === 1 && (
              <div className="form-step">
                <div className="form-group-premium">
                  <label htmlFor="username" className="form-label-premium">
                    <span className="label-icon">👤</span>
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Choisissez un nom d'utilisateur unique"
                    className="form-input-premium"
                  />
                </div>
                
                <div className="form-group-premium">
                  <label htmlFor="email" className="form-label-premium">
                    <span className="label-icon">📧</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="votre@email.com"
                    className="form-input-premium"
                  />
                </div>
                
                <div className="form-group-premium">
                  <label htmlFor="password" className="form-label-premium">
                    <span className="label-icon">🔒</span>
                    Mot de passe *
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
                      placeholder="Au moins 6 caractères"
                      minLength="6"
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
                
                <div className="form-group-premium">
                  <label htmlFor="confirmPassword" className="form-label-premium">
                    <span className="label-icon">✅</span>
                    Confirmer le mot de passe *
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Confirmez votre mot de passe"
                      minLength="6"
                      className="form-input-premium"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button 
                  type="button"
                  className="register-premium-btn next-btn"
                  onClick={nextStep}
                >
                  <span>Continuer</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-step">
                <div className="form-row">
                  <div className="form-group-premium">
                    <label htmlFor="first_name" className="form-label-premium">
                      <span className="label-icon">👨</span>
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Votre prénom"
                      className="form-input-premium"
                    />
                  </div>
                  
                  <div className="form-group-premium">
                    <label htmlFor="last_name" className="form-label-premium">
                      <span className="label-icon">👪</span>
                      Nom
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Votre nom"
                      className="form-input-premium"
                    />
                  </div>
                </div>
                
                <div className="form-group-premium">
                  <label htmlFor="phone_number" className="form-label-premium">
                    <span className="label-icon">📱</span>
                    Téléphone
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="+33 1 23 45 67 89"
                    className="form-input-premium"
                  />
                </div>
                
                <div className="form-group-premium">
                  <label htmlFor="date_of_birth" className="form-label-premium">
                    <span className="label-icon">🎂</span>
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input-premium"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="register-premium-btn secondary"
                    onClick={prevStep}
                  >
                    <span className="btn-arrow">←</span>
                    <span>Retour</span>
                  </button>
                  
                  <button 
                    type="submit" 
                    className={`register-premium-btn primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Création du compte...
                      </>
                    ) : (
                      <>
                        <span>Créer mon compte</span>
                        <span className="btn-arrow">🎉</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="register-premium-footer">
            <p className="login-prompt">
              Déjà un compte ?{' '}
              <Link to="/login" className="login-link">
                Se connecter
              </Link>
            </p>
            
            <div className="register-premium-benefits">
              <h4>Vos avantages :</h4>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <span>Accès aux bourses</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📊</span>
                  <span>Suivi personnalisé</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔔</span>
                  <span>Alertes opportunités</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span>Recommandations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;