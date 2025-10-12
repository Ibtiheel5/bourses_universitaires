// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import UserList from './components/UserList';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Vérification de l\'authentification...');
      
      // Étape 1: Récupérer le token CSRF d'abord
      try {
        await api.get('/users/csrf/');
        console.log('✅ Token CSRF récupéré');
      } catch (csrfError) {
        console.log('⚠️ CSRF non disponible, continuation...');
      }
      
      // Étape 2: Vérifier l'utilisateur connecté
      const response = await api.get('/users/me/');
      console.log('✅ Utilisateur connecté trouvé:', response.data);
      setUser(response.data);
      
    } catch (error) {
      console.log('❌ Aucun utilisateur connecté (c\'est normal):', error.response?.status, error.message);
      // Une erreur 401 est normale quand l'utilisateur n'est pas connecté
      setUser(null);
    } finally {
      console.log('🏁 Fin de la vérification d\'authentification');
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const handleLogin = (userData) => {
    console.log('🔑 Connexion réussie:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.post('/users/logout/');
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      // Force refresh pour nettoyer l'état
      window.location.href = '/login';
    }
  };

  // Fonction pour déterminer le composant de dashboard à afficher
  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    
    if (user.user_type === 'admin') {
      return <AdminDashboard user={user} />;
    } else {
      return <Dashboard user={user} />;
    }
  };

  // Écran de chargement premium
  if (loading) {
    return (
      <div className="app-loading-premium">
        <div className="loading-content">
          <div className="loading-logo">
            <div className="logo-icon">🎓</div>
            <h1>CampusBourses</h1>
          </div>
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div className="loading-progress-fill"></div>
            </div>
            <p>Initialisation de votre espace...</p>
          </div>
          <div className="loading-features">
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <span>Interface Ultra-Rapide</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <span>Expérience Personnalisée</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <span>Sécurité Maximale</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Navbar conditionnelle - ne pas afficher sur les pages d'authentification */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <div className={`app-container ${!user ? 'auth-layout' : ''}`}>
          <Routes>
            {/* Routes d'authentification - accessibles seulement si non connecté */}
            <Route 
              path="/login" 
              element={
                !user ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                !user ? (
                  <Register onLogin={handleLogin} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Routes protégées - accessibles seulement si connecté */}
            <Route 
              path="/users" 
              element={
                user?.user_type === 'admin' ? (
                  <UserList />
                ) : user ? (
                  <Navigate to="/" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* Route dashboard principale avec routing intelligent */}
            <Route 
              path="/" 
              element={renderDashboard()}
            />
            
            {/* Route de fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;