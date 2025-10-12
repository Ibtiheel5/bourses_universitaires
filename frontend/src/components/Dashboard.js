// src/components/Dashboard.js (Version Premium)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Icônes académiques premium
const AcademicIcons = {
  applications: '📝',
  approved: '✅',
  pending: '⏳',
  amount: '💰',
  students: '👥',
  success: '📈',
  calendar: '📅',
  documents: '📑',
  analytics: '📊',
  settings: '⚙️'
};

const ActionIcons = {
  newApplication: '📋',
  documents: '📑',
  status: '🔍',
  calendar: '📅',
  analytics: '📊',
  settings: '⚙️',
  profile: '👤',
  help: '❓'
};

// Composant Carte de Statistique
const StatCard = ({ title, value, trend, icon, color, subtitle, onClick, progress }) => (
  <div className={`stat-card-premium ${color}`} onClick={onClick}>
    <div className="stat-header">
      <div className="stat-icon">{icon}</div>
      <span className={`stat-trend ${trend.direction}`}>
        {trend.value} {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
      </span>
    </div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{title}</p>
      {subtitle && <span className="stat-subtitle">{subtitle}</span>}
    </div>
    {progress && (
      <div className="stat-footer">
        <div className="progress-bar">
          <div className="progress-fill" style={{width: `${progress}%`}}></div>
        </div>
        <span className="progress-text">{progress}% complété</span>
      </div>
    )}
  </div>
);

// Composant Carte d'Action
const ActionCard = ({ title, description, icon, color, onClick, badge, disabled }) => (
  <button 
    className={`action-card ${color} ${disabled ? 'disabled' : ''}`} 
    onClick={onClick}
    disabled={disabled}
  >
    <div className="action-icon">{icon}</div>
    <div className="action-content">
      <span className="action-title">{title}</span>
      <span className="action-description">{description}</span>
    </div>
    {badge && <span className="action-badge">{badge}</span>}
  </button>
);

// Composant Échéance
const DeadlineCard = ({ title, date, daysLeft, type, priority }) => (
  <div className={`deadline-card ${priority}`}>
    <div className="deadline-header">
      <span className="deadline-icon">
        {type === 'academic' ? '🎓' : '📋'}
      </span>
      <span className="deadline-days">{daysLeft}j</span>
    </div>
    <div className="deadline-content">
      <h4>{title}</h4>
      <p>Échéance: {new Date(date).toLocaleDateString('fr-FR')}</p>
    </div>
    <div className={`deadline-priority ${priority}`}>
      {priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Important' : 'Normal'}
    </div>
  </div>
);

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const navigate = useNavigate();

  // Données mockées enrichies
  const mockData = useMemo(() => ({
    stats: {
      total_applications: { value: 12, trend: { value: '+12%', direction: 'up' } },
      approved_applications: { value: 8, trend: { value: '+8%', direction: 'up' } },
      pending_applications: { value: 3, trend: { value: '0%', direction: 'stable' } },
      scholarship_amount: { value: '24,500€', trend: { value: '+15%', direction: 'up' } },
      success_rate: { value: '67%', trend: { value: '+5%', direction: 'up' } },
      active_students: { value: 156, trend: { value: '+23%', direction: 'up' } }
    },
    activity: [
      { 
        id: 1, 
        type: 'Demande', 
        message: 'Nouvelle demande de bourse déposée - Bourse Excellence 2024', 
        date: 'Aujourd\'hui, 14:30', 
        status: 'completed',
        priority: 'high'
      },
      { 
        id: 2, 
        type: 'Examen', 
        message: 'Votre dossier est en cours d\'examen par le comité pédagogique', 
        date: 'Hier, 09:15', 
        status: 'in-progress',
        priority: 'medium'
      },
      { 
        id: 3, 
        type: 'Approbation', 
        message: 'Bourse Mérite Universitaire approuvée - 5,000€', 
        date: '15 Oct, 2024', 
        status: 'completed',
        priority: 'low'
      }
    ],
    quickStats: [
      { label: 'Délai moyen traitement', value: '14 jours', trend: 'stable' },
      { label: 'Taux de réussite', value: '67%', trend: 'up' },
      { label: 'Dossiers complets', value: '92%', trend: 'up' },
      { label: 'Temps de réponse', value: '48h', trend: 'down' }
    ],
    deadlines: [
      { id: 1, title: 'Bourse Excellence', date: '2024-10-15', daysLeft: 4, type: 'academic', priority: 'high' },
      { id: 2, title: 'Documents financiers', date: '2024-10-25', daysLeft: 14, type: 'administrative', priority: 'medium' },
      { id: 3, title: 'Renouvellement semestre', date: '2024-11-10', daysLeft: 30, type: 'academic', priority: 'low' }
    ]
  }), []);

  // Fonctions de gestion
  const handleNewApplication = useCallback(() => {
    console.log('Nouvelle demande de bourse');
    navigate('/applications/new');
  }, [navigate]);

  const handleViewDetails = useCallback((statType) => {
    console.log('Voir détails:', statType);
    setActiveTab('applications');
  }, []);

  const handleQuickAction = useCallback((action) => {
    console.log('Action rapide:', action);
    switch (action) {
      case 'new-application':
        handleNewApplication();
        break;
      case 'view-documents':
        navigate('/documents');
        break;
      case 'track-status':
        setActiveTab('applications');
        break;
      case 'academic-calendar':
        setActiveTab('calendar');
        break;
      default:
        console.log('Action non gérée:', action);
    }
  }, [handleNewApplication, navigate]);

  // Effets
  useEffect(() => {
    const loadDashboardData = () => {
      setTimeout(() => {
        setStats(mockData.stats);
        setRecentActivity(mockData.activity);
        setQuickStats(mockData.quickStats);
        setDeadlines(mockData.deadlines);
        setLoading(false);
      }, 1500);
    };

    loadDashboardData();
  }, [mockData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getTimeBasedEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  };

  if (loading) {
    return (
      <div className="dashboard-loading-premium">
        <div className="premium-loading">
          <div className="loading-cap">🎓</div>
          <p>Chargement de votre espace académique...</p>
          <div className="loading-progress">
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour les administrateurs
  if (user?.user_type === 'admin') {
    return (
      <div className="premium-dashboard admin">
        <header className="premium-dashboard-header admin">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                <span className="welcome-greeting">Tableau de Bord Administrateur</span>
                <span className="admin-badge">👑</span>
              </h1>
              <p className="welcome-subtitle">
                Gestion complète du système de bourses - 
                <span className="realtime-indicator"> {user.first_name} {user.last_name}</span>
              </p>
            </div>
            
            <div className="header-actions">
              <div className="quick-stats-bar admin">
                <div className="quick-stat">
                  <span className="stat-value">243</span>
                  <span className="stat-label">Utilisateurs</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">18</span>
                  <span className="stat-label">En attente</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">1.2M€</span>
                  <span className="stat-label">Budget</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="premium-tabs-navigation admin">
          <button className={`premium-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}>
            <span className="tab-icon">📊</span>
            <span className="tab-label">Vue d'ensemble</span>
          </button>
          <button className={`premium-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}>
            <span className="tab-icon">👥</span>
            <span className="tab-label">Utilisateurs</span>
            <span className="tab-badge">12</span>
          </button>
          <button className={`premium-tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}>
            <span className="tab-icon">📝</span>
            <span className="tab-label">Demandes</span>
            <span className="tab-badge">18</span>
          </button>
          <button className={`premium-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}>
            <span className="tab-icon">📈</span>
            <span className="tab-label">Analytics</span>
          </button>
          <button className={`premium-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}>
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">Paramètres</span>
          </button>
        </nav>

        <main className="premium-dashboard-content admin">
          {activeTab === 'overview' && (
            <>
              <section className="admin-stats-section">
                <div className="section-header">
                  <h2>Statistiques Globales</h2>
                  <div className="time-filter">
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                      <option value="quarter">Ce trimestre</option>
                      <option value="year">Cette année</option>
                    </select>
                  </div>
                </div>

                <div className="stats-grid-premium admin">
                  <StatCard
                    title="Utilisateurs Totaux"
                    value="243"
                    trend={{ value: '+15%', direction: 'up' }}
                    icon={AcademicIcons.students}
                    color="primary"
                  />
                  <StatCard
                    title="Demandes en Attente"
                    value="18"
                    trend={{ value: '+5%', direction: 'up' }}
                    icon={AcademicIcons.pending}
                    color="warning"
                  />
                  <StatCard
                    title="Bourses Attribuées"
                    value="156"
                    trend={{ value: '+12%', direction: 'up' }}
                    icon={AcademicIcons.approved}
                    color="success"
                  />
                  <StatCard
                    title="Budget Total"
                    value="1.2M€"
                    trend={{ value: '+8%', direction: 'up' }}
                    icon={AcademicIcons.amount}
                    color="info"
                  />
                </div>
              </section>

              <div className="admin-content-grid">
                <section className="quick-actions-section admin">
                  <h3>Actions Administrateur</h3>
                  <div className="actions-grid admin">
                    <ActionCard
                      title="Gérer les Utilisateurs"
                      description="Voir et gérer tous les utilisateurs du système"
                      icon={ActionIcons.documents}
                      color="primary"
                      onClick={() => navigate('/users')}
                    />
                    <ActionCard
                      title="Analytics Complets"
                      description="Statistiques détaillées et rapports avancés"
                      icon={ActionIcons.analytics}
                      color="info"
                      onClick={() => setActiveTab('analytics')}
                    />
                    <ActionCard
                      title="Paramètres Système"
                      description="Configuration et paramètres avancés"
                      icon={ActionIcons.settings}
                      color="secondary"
                      onClick={() => setActiveTab('settings')}
                    />
                  </div>
                </section>

                <section className="recent-activity-section">
                  <h3>Activité Récente</h3>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className={`activity-item ${activity.priority}`}>
                        <div className="activity-icon">
                          {activity.status === 'completed' ? '✅' : '⏳'}
                        </div>
                        <div className="activity-content">
                          <p className="activity-message">{activity.message}</p>
                          <span className="activity-time">{activity.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="tab-content">
              <h2>Gestion des Utilisateurs</h2>
              <p>Interface de gestion des utilisateurs à implémenter</p>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="tab-content">
              <h2>Gestion des Demandes</h2>
              <p>Interface de gestion des demandes de bourse à implémenter</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="tab-content">
              <h2>Analytics Avancés</h2>
              <p>Tableaux de bord analytiques détaillés à implémenter</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content">
              <h2>Paramètres Système</h2>
              <p>Configuration du système à implémenter</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Rendu pour les étudiants
  return (
    <div className="premium-dashboard student">
      {/* Header Premium */}
      <header className="premium-dashboard-header student">
        <div className="header-content">
          <div className="welcome-section">
            <h1>
              <span className="welcome-greeting">
                {getGreeting()}, {user?.first_name || user?.username}
              </span>
              <span className="welcome-emoji">{getTimeBasedEmoji()}</span>
            </h1>
            <p className="welcome-subtitle">
              Bienvenue sur votre portail de bourses universitaires
              <span className="realtime-indicator"> • Temps réel</span>
            </p>
          </div>
          
          <div className="header-actions">
            <div className="quick-stats-bar">
              <div className="quick-stat">
                <span className="stat-value">{stats?.pending_applications?.value || 0}</span>
                <span className="stat-label">En attente</span>
              </div>
              <div className="quick-stat">
                <span className="stat-value">{stats?.success_rate?.value || '0%'}</span>
                <span className="stat-label">Taux réussite</span>
              </div>
              <div className="quick-stat">
                <span className="stat-value">{stats?.scholarship_amount?.value || '0€'}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation par Onglets Premium */}
      <nav className="premium-tabs-navigation student">
        <button 
          className={`premium-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Vue d'ensemble</span>
        </button>
        <button 
          className={`premium-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">Mes Demandes</span>
          {stats?.pending_applications?.value > 0 && (
            <span className="tab-badge">{stats.pending_applications.value}</span>
          )}
        </button>
        <button 
          className={`premium-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <span className="tab-icon">📑</span>
          <span className="tab-label">Documents</span>
        </button>
        <button 
          className={`premium-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Calendrier</span>
        </button>
        <button 
          className={`premium-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-label">Profil</span>
        </button>
      </nav>

      {/* Contenu Principal */}
      <main className="premium-dashboard-content student">
        {activeTab === 'overview' && (
          <>
            {/* Statistiques Académiques Premium */}
            <section className="main-stats-section">
              <div className="section-header">
                <h2>Tableau de Bord Académique</h2>
                <div className="section-actions">
                  <button className="btn-export">📊 Exporter Rapport</button>
                  <button className="btn-refresh">🔄 Actualiser</button>
                </div>
              </div>

              <div className="stats-grid-premium">
                <StatCard
                  title="Demandes déposées"
                  value={stats?.total_applications?.value || 0}
                  trend={stats?.total_applications?.trend || { value: '0%', direction: 'stable' }}
                  icon={AcademicIcons.applications}
                  color="primary"
                  onClick={() => handleViewDetails('applications')}
                  progress={75}
                />
                <StatCard
                  title="Bourses obtenues"
                  value={stats?.approved_applications?.value || 0}
                  trend={stats?.approved_applications?.trend || { value: '0%', direction: 'stable' }}
                  icon={AcademicIcons.approved}
                  color="success"
                  subtitle={`Taux de réussite: ${stats?.success_rate?.value || '0%'}`}
                  onClick={() => handleViewDetails('approved')}
                />
                <StatCard
                  title="En attente"
                  value={stats?.pending_applications?.value || 0}
                  trend={stats?.pending_applications?.trend || { value: '0%', direction: 'stable' }}
                  icon={AcademicIcons.pending}
                  color="warning"
                  onClick={() => handleViewDetails('pending')}
                />
                <StatCard
                  title="Total des bourses"
                  value={stats?.scholarship_amount?.value || '0€'}
                  trend={stats?.scholarship_amount?.trend || { value: '0%', direction: 'stable' }}
                  icon={AcademicIcons.amount}
                  color="info"
                  onClick={() => handleViewDetails('amount')}
                />
              </div>
            </section>

            {/* Actions Rapides */}
            <section className="quick-actions-section">
              <h3>Actions Rapides</h3>
              <div className="actions-grid">
                <ActionCard
                  title="Nouvelle Demande"
                  description="Déposer une nouvelle demande de bourse universitaire"
                  icon={ActionIcons.newApplication}
                  color="primary"
                  badge="Nouveau"
                  onClick={() => handleQuickAction('new-application')}
                />
                <ActionCard
                  title="Gérer Documents"
                  description="Consulter et télécharger vos pièces justificatives"
                  icon={ActionIcons.documents}
                  color="secondary"
                  onClick={() => handleQuickAction('view-documents')}
                />
                <ActionCard
                  title="Suivi Dossier"
                  description="Vérifier l'état d'avancement de vos demandes"
                  icon={ActionIcons.status}
                  color="info"
                  badge={stats?.pending_applications?.value > 0 ? `${stats.pending_applications.value} en cours` : null}
                  onClick={() => handleQuickAction('track-status')}
                />
                <ActionCard
                  title="Calendrier Académique"
                  description="Consulter les dates importantes et échéances"
                  icon={ActionIcons.calendar}
                  color="secondary"
                  onClick={() => handleQuickAction('academic-calendar')}
                />
              </div>
            </section>

            {/* Échéances et Activité */}
            <div className="overview-grid">
              <section className="deadlines-section">
                <h3>📅 Échéances à venir</h3>
                <div className="deadlines-list">
                  {deadlines.map(deadline => (
                    <DeadlineCard key={deadline.id} {...deadline} />
                  ))}
                </div>
              </section>

              <section className="recent-activity-section">
                <h3>📋 Activité Récente</h3>
                <div className="activity-list">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className={`activity-item ${activity.priority}`}>
                      <div className="activity-icon">
                        {activity.status === 'completed' ? '✅' : '⏳'}
                      </div>
                      <div className="activity-content">
                        <p className="activity-message">{activity.message}</p>
                        <span className="activity-time">{activity.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'applications' && (
          <div className="tab-content">
            <h2>Mes Demandes de Bourse</h2>
            <p>Gérez vos demandes de bourse en cours et passées.</p>
            {/* Contenu des demandes à implémenter */}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-content">
            <h2>Mes Documents</h2>
            <p>Gérez vos documents et pièces justificatives.</p>
            {/* Contenu des documents à implémenter */}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="tab-content">
            <h2>Calendrier Académique</h2>
            <p>Consultez les dates importantes et échéances.</p>
            {/* Contenu du calendrier à implémenter */}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-content">
            <h2>Mon Profil</h2>
            <p>Gérez vos informations personnelles.</p>
            {/* Contenu du profil à implémenter */}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;