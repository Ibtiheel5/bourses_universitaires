// src/components/Notifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantCount, setImportantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unread');
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/student/notifications/');
      
      setUnreadNotifications(response.data.unread || []);
      setNotifications(response.data.recent || []);
      setUnreadCount(response.data.unread_count || 0);
      setImportantCount(response.data.important_count || 0);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Données de démonstration en cas d'erreur
      setUnreadNotifications([]);
      setNotifications([]);
      setUnreadCount(0);
      setImportantCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/users/student/notifications/${notificationId}/read/`);
      
      // Mettre à jour l'état local
      setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Erreur lors du marquage de la notification');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await api.post('/users/student/notifications/read-all/');
      
      // Mettre à jour l'état local
      setUnreadNotifications([]);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      setImportantCount(0);
      
      alert('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Erreur lors du marquage des notifications');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      return;
    }

    try {
      await api.delete(`/users/student/notifications/${notificationId}/delete/`);
      
      // Mettre à jour l'état local
      setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Erreur lors de la suppression de la notification');
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.post('/users/student/notifications/delete-all/');
      
      // Mettre à jour l'état local
      setUnreadNotifications([]);
      setNotifications([]);
      setUnreadCount(0);
      setImportantCount(0);
      
      alert('Toutes les notifications ont été supprimées');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('Erreur lors de la suppression des notifications');
    }
  };

 const handleNotificationClick = (notification) => {
  if (!notification.is_read) {
    markAsRead(notification.id);
  }
  
  // Navigation basée sur le type de notification
  if (notification.related_document_id) {
    navigate('/documents');
  } else if (notification.related_application_id) {
    navigate('/applications');
  }
};

  const getDisplayNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'important':
        return notifications.filter(n => n.is_important);
      case 'all':
        return notifications;
      default:
        return unreadNotifications;
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
const NotificationItem = ({ notification }) => (
  <div 
    className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${notification.is_important ? 'important' : ''}`}
    onClick={() => handleNotificationClick(notification)}
  >
    <div className="notification-icon">
      {notification.icon || 
       (notification.notification_type === 'document_verified' ? '✅' : 
        notification.notification_type === 'document_rejected' ? '❌' : '🔔')}
    </div>
    
    <div className="notification-content">
      <div className="notification-header">
        <h4 className="notification-title">{notification.title}</h4>
        <span className="notification-time">{notification.time_ago}</span>
      </div>
      
      <p className="notification-message">{notification.message}</p>
      
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
    </div>
    
    <div className="notification-actions">
      {!notification.is_read && (
        <button 
          className="btn-mark-read"
          onClick={(e) => {
            e.stopPropagation();
            markAsRead(notification.id);
          }}
          title="Marquer comme lu"
        >
          ✓
        </button>
      )}
      
      <button 
        className="btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notification.id);
        }}
        title="Supprimer"
      >
        ×
      </button>
    </div>
    
    {!notification.is_read && (
      <div className="notification-indicator"></div>
    )}
  </div>
);

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>🔔 Mes Notifications</h1>
        <p>Restez informé de l'état de vos demandes et documents</p>
      </div>

      {/* Statistiques */}
      <div className="notifications-stats">
        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-content">
            <span className="stat-value">{notifications.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        
        <div className="stat-card unread">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <span className="stat-value">{unreadCount}</span>
            <span className="stat-label">Non lues</span>
          </div>
        </div>
        
        <div className="stat-card important">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <span className="stat-value">{importantCount}</span>
            <span className="stat-label">Importantes</span>
          </div>
        </div>
      </div>

      {/* Actions globales */}
      <div className="notifications-actions">
        <div className="actions-left">
          <button 
            className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            🔔 Non lues ({unreadCount})
          </button>
          <button 
            className={`tab-button ${activeTab === 'important' ? 'active' : ''}`}
            onClick={() => setActiveTab('important')}
          >
            ⚠️ Importantes ({importantCount})
          </button>
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📨 Toutes ({notifications.length})
          </button>
        </div>
        
        <div className="actions-right">
          {unreadCount > 0 && (
            <button 
              className="btn-mark-all-read"
              onClick={markAllAsRead}
            >
              📥 Tout marquer comme lu
            </button>
          )}
          
          {notifications.length > 0 && (
            <button 
              className="btn-delete-all"
              onClick={deleteAllNotifications}
            >
              🗑️ Tout supprimer
            </button>
          )}
          
          <button 
            className="btn-refresh"
            onClick={loadNotifications}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="notifications-list">
        {getDisplayNotifications().length > 0 ? (
          getDisplayNotifications().map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <div className="no-notifications">
            <div className="no-notifications-icon">
              {activeTab === 'unread' ? '🎉' : 
               activeTab === 'important' ? '✅' : '📋'}
            </div>
            <h3>
              {activeTab === 'unread' ? 'Aucune notification non lue' : 
               activeTab === 'important' ? 'Aucune notification importante' : 
               'Aucune notification'}
            </h3>
            <p>
              {activeTab === 'unread' ? 'Toutes vos notifications sont à jour !' : 
               activeTab === 'important' ? 'Aucune notification marquée comme importante' : 
               'Vous n\'avez pas encore de notifications'}
            </p>
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="notifications-footer">
        <p>
          💡 <strong>Astuce :</strong> Cliquez sur une notification pour accéder directement au contenu associé
        </p>
        <p className="last-updated">
          Dernière mise à jour : {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Notifications;