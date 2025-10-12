// src/components/AdminDashboard.js - MODE CLAIR
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const navigate = useNavigate();

  // Données mockées pour l'admin
  const mockData = useMemo(() => ({
    stats: {
      total_users: { value: '1,243', trend: { value: '+15%', direction: 'up' } },
      pending_applications: { value: '42', trend: { value: '+8%', direction: 'up' } },
      approved_applications: { value: '892', trend: { value: '+12%', direction: 'up' } },
      total_budget: { value: '2.8M€', trend: { value: '+20%', direction: 'up' } },
      system_uptime: { value: '99.9%', trend: { value: '+0.1%', direction: 'up' } },
      avg_response_time: { value: '1.2s', trend: { value: '-0.3s', direction: 'down' } }
    },
    activity: [
      {
        id: 1,
        user: 'Marie Curie',
        action: 'Nouvelle demande déposée - Bourse Excellence',
        type: 'application',
        time: '2 minutes',
        priority: 'high'
      },
      {
        id: 2,
        user: 'Système',
        action: 'Sauvegarde automatique effectuée avec succès',
        type: 'system',
        time: '1 heure',
        priority: 'low'
      },
      {
        id: 3,
        user: 'Jean Dupont',
        action: 'Document uploadé - Pièce manquante détectée',
        type: 'document',
        time: '3 heures',
        priority: 'medium'
      },
      {
        id: 4,
        user: 'Admin System',
        action: 'Maintenance planifiée pour ce weekend',
        type: 'system',
        time: '24 heures',
        priority: 'medium'
      }
    ],
    systemHealth: {
      cpu: 45,
      memory: 68,
      storage: 82,
      network: 95,
      status: 'healthy'
    },
    alerts: [
      { id: 1, type: 'warning', message: 'Stockage à 82% - Nettoyage recommandé', time: '2h' },
      { id: 2, type: 'info', message: 'Maintenance planifiée dimanche 02:00-04:00', time: '24h' },
      { id: 3, type: 'success', message: 'Sauvegarde automatique réussie', time: '6h' }
    ]
  }), []);

  // Composant Carte Statistique Admin
  const AdminStatCard = ({ title, value, trend, icon, color, subtitle, metric }) => (
    <div className={`admin-stat-card-light ${color}`}>
      <div className="admin-stat-background-light">
        <div className="admin-stat-glow-light"></div>
      </div>
      <div className="admin-stat-header-light">
        <div className="admin-stat-icon-wrapper-light">
          <div className="admin-stat-icon-light">{icon}</div>
        </div>
        <div className="admin-stat-trend-light">
          <span className={`trend-light ${trend.direction}`}>
            {trend.value}
          </span>
        </div>
      </div>
      <div className="admin-stat-content-light">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <span className="admin-stat-subtitle-light">{subtitle}</span>}
      </div>
      {metric && (
        <div className="admin-stat-metric-light">
          <div className="metric-bar-light">
            <div 
              className="metric-fill-light" 
              style={{width: `${metric.value}%`}}
              data-value={metric.value}
            ></div>
          </div>
          <span className="metric-label-light">{metric.label}</span>
        </div>
      )}
      <div className="admin-stat-hover-light"></div>
    </div>
  );

  // Composant Carte Action Admin
  const AdminActionCard = ({ title, description, icon, color, onClick, count }) => (
    <button className={`admin-action-card-light ${color}`} onClick={onClick}>
      <div className="admin-action-background-light"></div>
      <div className="admin-action-icon-light">{icon}</div>
      <div className="admin-action-content-light">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {count !== undefined && (
        <div className="admin-action-count-light">
          <span>{count}</span>
        </div>
      )}
      <div className="admin-action-arrow-light">→</div>
    </button>
  );

  // Composant Alerte Système
  const SystemAlert = ({ type, message, time }) => (
    <div className={`system-alert-light ${type}`}>
      <div className="alert-icon-light">
        {type === 'warning' ? '⚠️' : type === 'error' ? '🚨' : type === 'success' ? '✅' : 'ℹ️'}
      </div>
      <div className="alert-content-light">
        <p>{message}</p>
        <span>{time}</span>
      </div>
      <div className="alert-indicator-light"></div>
    </div>
  );

  // Composant Métrique Santé Système
  const HealthMetric = ({ label, value, max = 100, color }) => (
    <div className="health-metric-light">
      <div className="health-label-light">
        <span>{label}</span>
        <span className="health-value-light">{value}%</span>
      </div>
      <div className="health-bar-light">
        <div 
          className={`health-fill-light ${color}`}
          style={{width: `${(value / max) * 100}%`}}
        ></div>
      </div>
    </div>
  );

  // Composant Activité Admin
  const AdminActivityItem = ({ user, action, type, time, priority }) => (
    <div className={`admin-activity-item-light ${priority}`}>
      <div className="activity-icon-light">
        {type === 'application' ? '📝' : 
         type === 'system' ? '⚙️' : '📑'}
      </div>
      <div className="activity-content-light">
        <div className="activity-header-light">
          <span className="activity-user-light">{user}</span>
          <span className="activity-time-light">{time}</span>
        </div>
        <p className="activity-action-light">{action}</p>
      </div>
      <div className="activity-priority-light"></div>
    </div>
  );

  useEffect(() => {
    const loadAdminData = () => {
      setTimeout(() => {
        setStats(mockData.stats);
        setRecentActivity(mockData.activity);
        setSystemHealth(mockData.systemHealth);
        setAlerts(mockData.alerts);
        setLoading(false);
      }, 1000);
    };

    loadAdminData();
  }, [mockData]);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'manage-users':
        navigate('/users');
        break;
      case 'view-applications':
        setActiveTab('applications');
        break;
      case 'system-settings':
        setActiveTab('system');
        break;
      case 'reports':
        setActiveTab('analytics');
        break;
      case 'emergency-logout':
        handleEmergencyLogout();
        break;
      default:
        console.log('Action non gérée:', action);
    }
  };

  const handleEmergencyLogout = () => {
    if (window.confirm('Déconnexion administrateur ? Cette action vous redirigera vers la page de connexion.')) {
      onLogout?.();
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-light">
        <div className="admin-loading-content-light">
          <div className="admin-loading-logo-light">
            <div className="loading-crown-light">👑</div>
            <h2>Admin Dashboard</h2>
          </div>
          <div className="admin-loading-stats-light">
            <div className="loading-stat-light"></div>
            <div className="loading-stat-light"></div>
            <div className="loading-stat-light"></div>
          </div>
          <p>Chargement des données système...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-light">
      {/* Header Admin */}
      <header className="admin-header-light">
        <div className="admin-header-background-light">
          <div className="admin-glow-1-light"></div>
          <div className="admin-glow-2-light"></div>
        </div>
        
        <div className="admin-header-content-light">
          <div className="admin-welcome-light">
            <h1>
              <span className="admin-title-light">Tableau de Bord Administrateur</span>
              <span className="admin-badge-light">👑</span>
            </h1>
            <p className="admin-subtitle-light">
              Gestion complète du système CampusBourses
              <span className={`admin-status-light ${systemHealth.status}`}>
                {' '}• Système: {systemHealth.status === 'healthy' ? 'Optimal' : 'Surveillance'}
              </span>
            </p>
          </div>
          
          <div className="admin-quick-stats-light">
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.total_users.value}</span>
              <span className="quick-stat-label-light">Utilisateurs</span>
            </div>
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.pending_applications.value}</span>
              <span className="quick-stat-label-light">En attente</span>
            </div>
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.total_budget.value}</span>
              <span className="quick-stat-label-light">Budget</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Admin */}
      <nav className="admin-nav-light">
        <div className="admin-nav-container-light">
          {[
            { id: 'overview', label: 'Vue Globale', icon: '📊' },
            { id: 'users', label: 'Utilisateurs', icon: '👥', count: stats?.total_users.value },
            { id: 'applications', label: 'Demandes', icon: '📝', count: stats?.pending_applications.value },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'system', label: 'Système', icon: '⚙️' },
            { id: 'reports', label: 'Rapports', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-tab-light ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="admin-tab-icon-light">{tab.icon}</div>
              <span className="admin-tab-label-light">{tab.label}</span>
              {tab.count && <span className="admin-tab-count-light">{tab.count}</span>}
              <div className="admin-tab-indicator-light"></div>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main-light">
        {activeTab === 'overview' && (
          <div className="admin-overview-grid-light">
            {/* Section Statistiques Principales */}
            <section className="admin-stats-section-light">
              <div className="admin-section-header-light">
                <h2>Métriques Globales</h2>
                <div className="time-filter-admin-light">
                  <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <option value="week">Semaine</option>
                    <option value="month">Mois</option>
                    <option value="quarter">Trimestre</option>
                    <option value="year">Année</option>
                  </select>
                </div>
              </div>

              <div className="admin-stats-grid-light">
                <AdminStatCard
                  title="Utilisateurs Totaux"
                  value={stats.total_users.value}
                  trend={stats.total_users.trend}
                  icon="👥"
                  color="primary"
                  metric={{ value: 85, label: 'Actifs' }}
                />
                <AdminStatCard
                  title="Demandes en Attente"
                  value={stats.pending_applications.value}
                  trend={stats.pending_applications.trend}
                  icon="⏳"
                  color="warning"
                />
                <AdminStatCard
                  title="Bourses Attribuées"
                  value={stats.approved_applications.value}
                  trend={stats.approved_applications.trend}
                  icon="✅"
                  color="success"
                />
                <AdminStatCard
                  title="Budget Total"
                  value={stats.total_budget.value}
                  trend={stats.total_budget.trend}
                  icon="💰"
                  color="info"
                />
                <AdminStatCard
                  title="Disponibilité"
                  value={stats.system_uptime.value}
                  trend={stats.system_uptime.trend}
                  icon="🟢"
                  color="success"
                />
                <AdminStatCard
                  title="Temps Réponse"
                  value={stats.avg_response_time.value}
                  trend={stats.avg_response_time.trend}
                  icon="⚡"
                  color="info"
                />
              </div>
            </section>

            {/* Section Actions Rapides */}
            <section className="admin-actions-section-light">
              <h3>Actions Administratives</h3>
              <div className="admin-actions-grid-light">
                <AdminActionCard
                  title="Gérer Utilisateurs"
                  description="Gestion complète des comptes utilisateurs"
                  icon="👥"
                  color="primary"
                  count={stats.total_users.value}
                  onClick={() => handleQuickAction('manage-users')}
                />
                <AdminActionCard
                  title="Examiner Demandes"
                  description="Validation des demandes de bourse"
                  icon="📝"
                  color="warning"
                  count={stats.pending_applications.value}
                  onClick={() => handleQuickAction('view-applications')}
                />
                <AdminActionCard
                  title="Rapports Analytics"
                  description="Statistiques et analyses détaillées"
                  icon="📈"
                  color="info"
                  onClick={() => handleQuickAction('reports')}
                />
                <AdminActionCard
                  title="Paramètres Système"
                  description="Configuration et maintenance"
                  icon="⚙️"
                  color="secondary"
                  onClick={() => handleQuickAction('system-settings')}
                />
              </div>
            </section>

            {/* Section Santé Système */}
            <section className="system-health-section-light">
              <h3>🖥️ Santé du Système</h3>
              <div className="health-metrics-grid-light">
                <HealthMetric label="CPU" value={systemHealth.cpu} color="primary" />
                <HealthMetric label="Mémoire" value={systemHealth.memory} color="warning" />
                <HealthMetric label="Stockage" value={systemHealth.storage} color="danger" />
                <HealthMetric label="Réseau" value={systemHealth.network} color="success" />
              </div>
              
              <div className="system-alerts-light">
                <h4>Alertes Système</h4>
                <div className="alerts-list-light">
                  {alerts.map(alert => (
                    <SystemAlert key={alert.id} {...alert} />
                  ))}
                </div>
              </div>
            </section>

            {/* Section Activité Récente */}
            <section className="admin-activity-section-light">
              <h3>📋 Activité Récente</h3>
              <div className="admin-activity-list-light">
                {recentActivity.map(activity => (
                  <AdminActivityItem key={activity.id} {...activity} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Gestion des Utilisateurs</h2>
              <p>Administration complète des comptes utilisateurs</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">👥</div>
              <h3>Interface Utilisateurs</h3>
              <p>Gérez les comptes, permissions et accès utilisateurs</p>
              <button 
                className="btn-admin-primary-light"
                onClick={() => navigate('/users')}
              >
                👥 Accéder à la gestion utilisateurs
              </button>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Gestion des Demandes</h2>
              <p>Examen et validation des demandes de bourse</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">📝</div>
              <h3>Interface Demandes</h3>
              <p>Examinez, validez ou rejetez les demandes de bourse</p>
              <button className="btn-admin-primary-light">
                📋 Voir les demandes en attente
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Analytics Avancés</h2>
              <p>Statistiques détaillées et rapports performance</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">📊</div>
              <h3>Tableaux de Bord Analytics</h3>
              <p>Analyses approfondies et métriques détaillées</p>
              <button className="btn-admin-primary-light">
                📈 Générer rapports
              </button>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Paramètres Système</h2>
              <p>Configuration et maintenance de la plateforme</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">⚙️</div>
              <h3>Configuration Système</h3>
              <p>Paramètres avancés et maintenance technique</p>
              <button className="btn-admin-primary-light">
                ⚙️ Configurer le système
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Rapports et Exports</h2>
              <p>Génération de rapports et données d'export</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">📋</div>
              <h3>Gestion des Rapports</h3>
              <p>Créez et exportez des rapports détaillés</p>
              <button className="btn-admin-primary-light">
                📄 Générer un rapport
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Admin */}
      <footer className="admin-footer-light">
        <div className="admin-footer-content-light">
          <p>© 2024 CampusBourses - Panel d'Administration</p>
          <div className="admin-footer-links-light">
            <span className="admin-user-light">Connecté en tant que: {user?.username}</span>
            <button 
              className="admin-footer-link-light"
              onClick={() => handleQuickAction('emergency-logout')}
            >
              🔒 Déconnexion Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;