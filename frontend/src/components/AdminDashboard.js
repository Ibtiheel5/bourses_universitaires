import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ user, stats, notifications, onNotificationRead }) => {
  const [adminStats, setAdminStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Données administratives
    setAdminStats({
      totalUsers: 456,
      pendingApprovals: 23,
      totalDistributed: '2.5M€',
      systemHealth: '98%'
    });

    setRecentActivity([
      { id: 1, user: 'Jean Dupont', action: 'Nouvelle demande', time: '2 min ago' },
      { id: 2, user: 'Marie Curie', action: 'Document uploadé', time: '5 min ago' },
      { id: 3, user: 'Admin System', action: 'Maintenance planifiée', time: '1 hour ago' }
    ]);
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>🏛️ Tableau de Bord Administrateur</h1>
        <p>Gestion complète du système de bourses</p>
      </header>

      <div className="admin-stats-grid">
        {/* Cartes statistiques administrateur */}
        <div className="admin-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{adminStats.totalUsers}</h3>
            <p>Utilisateurs Totaux</p>
          </div>
        </div>

        {/* Ajouter d'autres cartes admin... */}
      </div>

      <div className="admin-content-grid">
        <div className="recent-activity">
          <h3>Activité Récente</h3>
          {/* Liste d'activités */}
        </div>

        <div className="system-health">
          <h3>Santé du Système</h3>
          {/* Métriques système */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;