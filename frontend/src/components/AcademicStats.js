import React from 'react';
import './AcademicStats.css';

const AcademicStats = ({ user, stats, onAction, realTimeData }) => {
  const quickActions = [
    {
      id: 'new-application',
      title: 'Nouvelle Demande',
      description: 'Déposer une nouvelle demande de bourse',
      icon: '📝',
      color: 'primary',
      badge: 'Nouveau'
    },
    {
      id: 'view-documents',
      title: 'Mes Documents',
      description: 'Gérer mes pièces justificatives',
      icon: '📑',
      color: 'secondary'
    },
    {
      id: 'track-status',
      title: 'Suivi Dossier',
      description: 'Vérifier l\'état de mes demandes',
      icon: '🔍',
      color: 'info',
      badge: stats?.userStats?.pending > 0 ? `${stats.userStats.pending} en attente` : null
    }
  ];

  return (
    <div className="academic-stats-premium">
      {/* Section Statistiques Principales */}
      <section className="main-stats-section">
        <div className="section-header">
          <h2>Tableau de Bord Académique</h2>
          <div className="section-actions">
            <button className="btn-export">📊 Exporter Rapport</button>
            <button className="btn-refresh">🔄 Actualiser</button>
          </div>
        </div>

        <div className="stats-grid-premium">
          {/* Carte Statistique 1 */}
          <div className="stat-card-premium primary">
            <div className="stat-header">
              <div className="stat-icon">🎓</div>
              <div className="stat-trend up">+12%</div>
            </div>
            <div className="stat-content">
              <h3>{stats?.userStats?.totalApplications || 0}</h3>
              <p>Demandes Totales</p>
              <span className="stat-subtitle">Cette année académique</span>
            </div>
            <div className="stat-footer">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>

          {/* Carte Statistique 2 */}
          <div className="stat-card-premium success">
            <div className="stat-header">
              <div className="stat-icon">✅</div>
              <div className="stat-trend up">+8%</div>
            </div>
            <div className="stat-content">
              <h3>{stats?.userStats?.approved || 0}</h3>
              <p>Bourses Obtenues</p>
              <span className="stat-subtitle">Taux de réussite: {stats?.userStats?.successRate || '0%'}</span>
            </div>
          </div>

          {/* Ajouter d'autres cartes statistiques... */}
        </div>
      </section>

      {/* Section Actions Rapides */}
      <section className="quick-actions-section">
        <h3>Actions Rapides</h3>
        <div className="actions-grid">
          {quickActions.map(action => (
            <button
              key={action.id}
              className={`action-card ${action.color}`}
              onClick={() => onAction(action.id)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <span className="action-title">{action.title}</span>
                <span className="action-description">{action.description}</span>
              </div>
              {action.badge && <span className="action-badge">{action.badge}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Section Analytics */}
      <section className="analytics-preview">
        <h3>Aperçu des Performances</h3>
        <div className="analytics-grid">
          {/* Graphiques et métriques supplémentaires */}
        </div>
      </section>
    </div>
  );
};

export default AcademicStats;