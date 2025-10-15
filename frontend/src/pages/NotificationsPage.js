// src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './NotificationsPage.css';

const NotificationsPage = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    loadAllNotifications();
  }, [user, navigate]);

  const loadAllNotifications = async () => {
    try {
      const response = await api.get('/users/admin/notifications/all/');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/users/admin/notifications/${notificationId}/read/`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/users/admin/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  if (loading) {
    return <div className="notifications-loading">Chargement...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <button 
            className="mark-all-read-btn"
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.is_read)}
          >
            Tout marquer comme lu
          </button>
          <button 
            className="refresh-btn"
            onClick={loadAllNotifications}
          >
            Actualiser
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {notification.notification_type === 'document_upload' ? '📄' : 
                 notification.notification_type === 'application_submitted' ? '📝' : 
                 notification.notification_type === 'user_registered' ? '👤' : '🔔'}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <span className="notification-title">{notification.title}</span>
                  <span className="notification-time">{notification.time_ago}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
                {notification.student_name && (
                  <span className="notification-student">Étudiant: {notification.student_name}</span>
                )}
                {notification.document_type_display && (
                  <span className="notification-document">Type: {notification.document_type_display}</span>
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
            <span>Toutes les notifications sont à jour</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;