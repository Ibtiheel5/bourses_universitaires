import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import UserList from './components/UserList';
import Dashboard from './components/Dashboard';
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
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
    }
  };

  // Écran de chargement seulement pendant la vérification initiale
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>CampusBourses</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Chargement de votre espace...</p>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/users" 
              element={user?.user_type === 'admin' ? <UserList /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} 
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