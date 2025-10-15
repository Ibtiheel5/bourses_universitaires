// src/components/Navbar.js - Version complète avec notifications étudiant
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantCount, setImportantCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Charger les notifications réelles
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Polling toutes les 30 secondes
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // src/components/Navbar.js - MODIFIER la fonction loadNotifications

const loadNotifications = async () => {
  if (!user) return;
  
  try {
    setLoading(true);
    
    if (user.user_type === 'admin') {
      // Notifications admin (garder les notifications système)
      const response = await api.get('/users/admin/notifications/');
      setNotifications(response.data.unread || []);
      setUnreadCount(response.data.unread_count || 0);
    } else if (user.user_type === 'student') {
      // Notifications étudiant (incluant maintenant les notifications de documents)
      const response = await api.get('/users/student/notifications/');
      setNotifications(response.data.unread || []);
      setUnreadCount(response.data.unread_count || 0);
      setImportantCount(response.data.important_count || 0);
    }
    
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
    setNotifications([]);
    setUnreadCount(0);
    setImportantCount(0);
  } finally {
    setLoading(false);
  }
};
  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      loadNotifications();
    }
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const markAsRead = async (notificationId) => {
    try {
      if (user.user_type === 'admin') {
        await api.post(`/users/admin/notifications/${notificationId}/read/`);
      } else {
        await api.post(`/users/student/notifications/${notificationId}/read/`);
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
      
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (user.user_type === 'admin') {
        for (const notification of notifications) {
          await api.post(`/users/admin/notifications/${notification.id}/read/`);
        }
      } else {
        await api.post('/users/student/notifications/read-all/');
      }
      
      setNotifications([]);
      setUnreadCount(0);
      setImportantCount(0);
      
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  const handleNotificationItemClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigation basée sur le type d'utilisateur et la notification
    if (user.user_type === 'admin') {
      if (notification.related_document_id) {
        navigate('/admin-documents');
      }
    } else {
      if (notification.related_document_id) {
        navigate('/documents');
      } else if (notification.related_application_id) {
        navigate('/applications');
      }
    }
    
    setShowNotifications(false);
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    if (user.user_type === 'admin') {
      navigate('/');
      setTimeout(() => {
        localStorage.setItem('adminActiveTab', 'notifications');
        window.dispatchEvent(new CustomEvent('adminTabChange', { detail: 'notifications' }));
      }, 100);
    } else {
      navigate('/notifications');
    }
  };

  // Fonction pour obtenir l'icône de notification
  const getNotificationIcon = (notification) => {
    if (user.user_type === 'admin') {
      return notification.notification_type === 'document_upload' ? '📄' : 
             notification.notification_type === 'application_submitted' ? '📝' : 
             notification.notification_type === 'user_registered' ? '👤' : '🔔';
    } else {
      return notification.icon || '🔔';
    }
  };

  // Fonction pour obtenir le titre du panneau
  const getNotificationsTitle = () => {
    return user.user_type === 'admin' ? 'Notifications Admin' : 'Mes Notifications';
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
              {/* Liens de Navigation Principaux */}
              {user.user_type === 'student' && (
                <>
                  <Link 
                    to="/applications" 
                    className={`nav-item-academic ${location.pathname === '/applications' ? 'active' : ''}`}
                  >
                    <span>📝</span>
                    <span>Mes Demandes</span>
                  </Link>
                  <Link 
                    to="/documents" 
                    className={`nav-item-academic ${location.pathname === '/documents' ? 'active' : ''}`}
                  >
                    <span>📁</span>
                    <span>Mes Documents</span>
                  </Link>
                </>
              )}

              {user.user_type === 'admin' && (
                <>
                  <Link 
                    to="/users" 
                    className={`nav-item-academic admin ${location.pathname === '/users' ? 'active' : ''}`}
                  >
                    <span>👥</span>
                    <span>Utilisateurs</span>
                  </Link>
                  <Link 
                    to="/admin-documents" 
                    className={`nav-item-academic admin ${location.pathname === '/admin-documents' ? 'active' : ''}`}
                  >
                    <span>📁</span>
                    <span>Documents Admin</span>
                  </Link>
                </>
              )}
              
              <Link 
                to="/eligibility-rules" 
                className={`nav-item-academic ${location.pathname === '/eligibility-rules' ? 'active' : ''}`}
              >
                <span>📋</span>
                <span>Règles</span>
              </Link>
              

              {/* Notifications (Admin et Student) */}
              {(user.user_type === 'admin' || user.user_type === 'student') && (
                <div className="nav-notifications" ref={notificationsRef}>
                  <button 
                    className="notification-bell"
                    onClick={handleNotificationClick}
                    title={`${unreadCount} notifications non lues`}
                  >
                    <span>🔔</span>
                    {unreadCount > 0 && (
                      <span className="notification-count">{unreadCount}</span>
                    )}
                  </button>

                  {/* Panneau des Notifications */}
                  {showNotifications && (
                    <div className="notifications-panel">
                      <div className="notifications-header">
                        <h3>{getNotificationsTitle()}</h3>
                        <div className="notifications-actions">
                          {unreadCount > 0 && (
                            <button 
                              className="mark-all-read-btn"
                              onClick={markAllAsRead}
                            >
                              Tout marquer comme lu
                            </button>
                          )}
                          <button 
                            className="refresh-btn"
                            onClick={loadNotifications}
                            disabled={loading}
                          >
                            {loading ? '🔄' : '↻'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="notifications-list">
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${notification.is_important ? 'important' : ''}`}
                              onClick={() => handleNotificationItemClick(notification)}
                            >
                              <div className="notification-icon">
                                {getNotificationIcon(notification)}
                              </div>
                              <div className="notification-content">
                                <div className="notification-header">
                                  <span className="notification-title">{notification.title}</span>
                                  <span className="notification-time">{notification.time_ago}</span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                
                                {/* Métadonnées spécifiques selon le type d'utilisateur */}
                                {user.user_type === 'admin' && (
                                  <>
                                    {notification.student_name && (
                                      <span className="notification-student">Étudiant: {notification.student_name}</span>
                                    )}
                                    {notification.document_type_display && (
                                      <span className="notification-document">Type: {notification.document_type_display}</span>
                                    )}
                                  </>
                                )}
                                
                                {user.user_type === 'student' && (
                                  <div className="notification-meta">
                                    {notification.document_type_display && (
                                      <span className="notification-tag document">📁 {notification.document_type_display}</span>
                                    )}
                                    {notification.application_title && (
                                      <span className="notification-tag application">📝 {notification.application_title}</span>
                                    )}
                                    {notification.is_important && (
                                      <span className="notification-tag important">⚠️ Important</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {!notification.is_read && (
                                <div className="notification-indicator"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-notifications">
                            <div className="no-notifications-icon">🎉</div>
                            <p>Aucune notification</p>
                            <span>Toutes vos notifications sont à jour</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="notifications-footer">
                        <button 
                          className="view-all-btn"
                          onClick={handleViewAllNotifications}
                        >
                          {user.user_type === 'admin' ? 'Voir toutes les notifications' : 'Voir mes notifications'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                    {user.user_type === 'admin' ? '👑 Administrateur' : '🎓 Étudiant'}
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
                        <span className="dropdown-role">
                          {user.user_type === 'admin' ? '👑 Administrateur' : '🎓 Étudiant'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item"
                      onClick={handleProfileClick}
                    >
                      <span>👤</span>
                      Mon Profil
                    </button>
                    
                    <div className="dropdown-divider"></div>

                    {user.user_type === 'admin' && (
                      <>
                        <Link 
                          to="/users" 
                          className="dropdown-item admin"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>👥</span>
                          Gestion Utilisateurs
                        </Link>
                        <Link 
                          to="/admin-documents" 
                          className="dropdown-item admin"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>📁</span>
                          Vérification Documents
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}

                    {user.user_type === 'student' && (
                      <>
                        <Link 
                          to="/applications" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>📝</span>
                          Mes Demandes
                        </Link>
                        <Link 
                          to="/notifications" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>🔔</span>
                          Mes Notifications
                          {unreadCount > 0 && (
                            <span className="dropdown-notification-count">{unreadCount}</span>
                          )}
                        </Link>
                        <Link 
                          to="/documents" 
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span>📁</span>
                          Mes Documents
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}
                    
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