import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fermer le menu utilisateur en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setNotifications(0);
    // Logique pour marquer les notifications comme lues
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
    navigate('/login');
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  return (
    <nav className="academic-navbar">
      <div className="nav-container-academic">
        {/* Logo et Brand */}
        <Link to="/" className="nav-logo-academic">
          <div className="logo-icon-academic">🎓</div>
          <div className="logo-text-academic">
            <span className="logo-main-academic">CampusBourses</span>
            <span className="logo-sub-academic">Portail Académique</span>
          </div>
        </Link>
        
        {/* Navigation */}
        <div className="nav-menu-academic">
          {user ? (
            <>
              {/* Notifications */}
              <div className="nav-notifications">
                <button 
                  className="notification-bell"
                  onClick={handleNotificationClick}
                >
                  <span>🔔</span>
                  {notifications > 0 && (
                    <span className="notification-count">{notifications}</span>
                  )}
                </button>
              </div>

              {/* Section Utilisateur */}
              <div className="user-section-academic" ref={userMenuRef}>
                <div 
                  className="user-avatar-academic"
                  onClick={handleUserMenuToggle}
                >
                  {getInitials(user)}
                </div>
                <div className="user-details-academic">
                  <span className="user-name-academic">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="user-status-academic">
                    {user.user_type === 'admin' ? 'Administrateur' : 'Étudiant'}
                  </span>
                </div>
                
                {/* Menu Utilisateur Déroulant */}
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {getInitials(user)}
                      </div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="dropdown-email">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>👤</span>
                      Mon Profil
                    </Link>
                    
                    <Link 
                      to="/settings" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>⚙️</span>
                      Paramètres
                    </Link>

                    {user.user_type === 'admin' && (
                      <>
                        <div className="dropdown-divider"></div>
                        <Link 
                          to="/users" 
                          className="dropdown-item admin"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>👥</span>
                          Administration
                        </Link>
                      </>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span>🚪</span>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>

              {/* Liens de Navigation */}
              {user.user_type === 'admin' && (
                <Link 
                  to="/users" 
                  className={`nav-item-academic admin ${location.pathname === '/users' ? 'active' : ''}`}
                >
                  <span>👥</span>
                  <span>Utilisateurs</span>
                </Link>
              )}
              
              <Link 
                to="/help" 
                className={`nav-item-academic help ${location.pathname === '/help' ? 'active' : ''}`}
              >
                <span>❓</span>
                <span>Aide</span>
              </Link>
            </>
          ) : (
            <div className="auth-section-academic">
              <Link 
                to="/login" 
                className={`nav-item-academic login ${location.pathname === '/login' ? 'active' : ''}`}
              >
                <span>Connexion</span>
              </Link>
              <Link 
                to="/register" 
                className={`nav-item-academic register ${location.pathname === '/register' ? 'active' : ''}`}
              >
                <span>S'inscrire</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;