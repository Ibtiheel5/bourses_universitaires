import React, { useState } from 'react';
import './NotificationSystem.css';

const NotificationSystem = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-system">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <button className="mark-all-read">Tout marquer comme lu</button>
          </div>
          
          <div className="notification-list">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {notification.type === 'success' ? '✅' : 
                   notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;