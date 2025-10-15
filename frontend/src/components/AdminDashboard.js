// src/components/AdminDashboard.js - COMPLETE CORRECTED VERSION
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const [analyticsData, setAnalyticsData] = useState(null);

  // Load admin data
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/users/admin/stats/');
      setStats(statsResponse.data);
      
      try {
        const docsResponse = await api.get('/users/admin/documents/');
        setDocuments(docsResponse.data);
      } catch (docsError) {
        console.error('Error loading documents:', docsError);
        setDocuments([]);
      }
      
      const notifResponse = await api.get('/users/admin/notifications/');
      setNotifications(notifResponse.data.unread || []);
      setUnreadCount(notifResponse.data.unread_count || 0);
      setRecentActivity(notifResponse.data.recent || []);
      
      setSystemHealth({
        cpu: 45,
        memory: 68,
        storage: 82,
        network: 95,
        status: 'healthy'
      });
      
      const newAlerts = [];
      if (statsResponse.data.unverified_documents > 10) {
        newAlerts.push({
          id: 1,
          type: 'warning',
          message: `${statsResponse.data.unverified_documents} documents pending verification`,
          time: 'Now'
        });
      }
      if (statsResponse.data.today_documents > 5) {
        newAlerts.push({
          id: 3,
          type: 'info',
          message: `${statsResponse.data.today_documents} new documents today`,
          time: 'Today'
        });
      }
      
      if (newAlerts.length === 0) {
        newAlerts.push({
          id: 4,
          type: 'success',
          message: 'System running normally',
          time: 'Now'
        });
      }
      
      setAlerts(newAlerts);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      setStats({
        total_users: 0,
        total_students: 0,
        total_documents: 0,
        unverified_documents: 0,
        pending_notifications: 0,
        today_documents: 0,
        week_documents: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Functions for Analytics
  const loadAnalyticsData = async () => {
    try {
      const mockAnalyticsData = {
        overview: {
          total_documents: documents.length,
          verified_documents: documents.filter(doc => doc.is_verified).length,
          unverified_documents: documents.filter(doc => !doc.is_verified).length,
          verification_rate: documents.length > 0 ? 
            (documents.filter(doc => doc.is_verified).length / documents.length * 100) : 0,
          weekly_trend: 12.5
        },
        documents_by_type: {
          identity: {
            count: documents.filter(doc => doc.document_type === 'identity').length,
            percentage: documents.length > 0 ? 
              (documents.filter(doc => doc.document_type === 'identity').length / documents.length * 100) : 0
          },
          academic: {
            count: documents.filter(doc => doc.document_type === 'academic').length,
            percentage: documents.length > 0 ? 
              (documents.filter(doc => doc.document_type === 'academic').length / documents.length * 100) : 0
          },
          financial: {
            count: documents.filter(doc => doc.document_type === 'financial').length,
            percentage: documents.length > 0 ? 
              (documents.filter(doc => doc.document_type === 'financial').length / documents.length * 100) : 0
          },
          residence: {
            count: documents.filter(doc => doc.document_type === 'residence').length,
            percentage: documents.length > 0 ? 
              (documents.filter(doc => doc.document_type === 'residence').length / documents.length * 100) : 0
          },
          other: {
            count: documents.filter(doc => doc.document_type === 'other').length,
            percentage: documents.length > 0 ? 
              (documents.filter(doc => doc.document_type === 'other').length / documents.length * 100) : 0
          }
        },
        daily_activity: [
          { date: '2025-10-06', day: 'Mon', count: 5 },
          { date: '2025-10-07', day: 'Tue', count: 8 },
          { date: '2025-10-08', day: 'Wed', count: 12 },
          { date: '2025-10-09', day: 'Thu', count: 7 },
          { date: '2025-10-10', day: 'Fri', count: 15 },
          { date: '2025-10-11', day: 'Sat', count: 3 },
          { date: '2025-10-12', day: 'Sun', count: 6 }
        ],
        performance_metrics: {
          average_verification_time: 2.3,
          rejection_rate: 4.2,
          user_satisfaction: 96,
          system_availability: 99.8
        },
        user_stats: {
          total_students: stats?.total_students || 0,
          total_users: stats?.total_users || 0,
          total_admins: 1,
          active_today: 15
        }
      };
      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const verifyDocument = async (documentId) => {
    try {
      await api.post(`/users/admin/documents/${documentId}/verify/`);
      await loadAdminData();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('documentVerified'));
      }
      
    } catch (error) {
      console.error('Erreur vérification document:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/users/admin/generate-report/');
      
      if (response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup with timeout to avoid DOM issues
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 100);
        
        setNotifications(prev => [{
          id: Date.now(),
          title: "Report generated",
          message: "Report has been generated successfully",
          type: 'success',
          time: 'Now'
        }, ...prev]);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (exportType = 'users') => {
    try {
      setLoading(true);
      
      const response = await api.get(`/users/admin/export-data/?type=${exportType}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') 
        || `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup with timeout
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);
      
      setNotifications(prev => [{
        id: Date.now(),
        title: "Data exported",
        message: `${exportType} data has been exported successfully`,
        type: 'success',
        time: 'Now'
      }, ...prev]);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/users/admin/generate-pdf-report/', {}, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campusbourses_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup with timeout
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);
      
      setNotifications(prev => [{
        id: Date.now(),
        title: "PDF report generated",
        message: "PDF report has been generated successfully",
        type: 'success',
        time: 'Now'
      }, ...prev]);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    
    const interval = setInterval(loadAdminData, 30000);
    return () => clearInterval(interval);
  }, [loadAdminData]);

  useEffect(() => {
    const handleTabChange = (event) => {
      if (event.detail && ['overview', 'users', 'documents', 'notifications', 'analytics'].includes(event.detail)) {
        setActiveTab(event.detail);
      }
    };

    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab && ['overview', 'users', 'documents', 'notifications', 'analytics'].includes(savedTab)) {
      setActiveTab(savedTab);
      localStorage.removeItem('adminActiveTab');
    }

    window.addEventListener('adminTabChange', handleTabChange);
    
    return () => {
      window.removeEventListener('adminTabChange', handleTabChange);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab]);

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/users/admin/notifications/${notificationId}/read/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.map(notification => 
        api.post(`/users/admin/notifications/${notification.id}/read/`)
      );
      await Promise.all(promises);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications:', error);
    }
  };

  // Components avec gestion sécurisée des événements
  const NotificationItem = React.memo(({ notification }) => (
    <div 
      className={`admin-notification-item ${notification.is_read ? 'read' : 'unread'}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (notification.related_document_id) {
          navigate('/admin-documents');
        }
        if (!notification.is_read) {
          markAsRead(notification.id);
        }
      }}
      style={{ cursor: notification.related_document_id ? 'pointer' : 'default' }}
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
          <span className="notification-student">Student: {notification.student_name}</span>
        )}
        {notification.document_type && (
          <span className="notification-document">Type: {notification.document_type}</span>
        )}
      </div>
      <div className="notification-actions">
        {!notification.is_read && (
          <button 
            className="btn-mark-read"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              markAsRead(notification.id);
            }}
            title="Mark as read"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  ));

  const AdminStatCard = React.memo(({ title, value, trend, icon, color, subtitle, metric, onClick }) => (
    <div 
      className={`admin-stat-card-light ${color}`} 
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="admin-stat-background-light">
        <div className="admin-stat-glow-light"></div>
      </div>
      <div className="admin-stat-header-light">
        <div className="admin-stat-icon-wrapper-light">
          <div className="admin-stat-icon-light">{icon}</div>
        </div>
        {trend && (
          <div className="admin-stat-trend-light">
            <span className={`trend-light ${trend.direction}`}>
              {trend.value}
            </span>
          </div>
        )}
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
  ));

  const AdminActionCard = React.memo(({ title, description, icon, color, onClick, count, disabled }) => (
    <button 
      className={`admin-action-card-light ${color} ${disabled ? 'disabled' : ''}`} 
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      disabled={disabled}
      type="button"
    >
      <div className="admin-action-background-light"></div>
      <div className="admin-action-icon-light">{icon}</div>
      <div className="admin-action-content-light">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {count !== undefined && count > 0 && (
        <div className="admin-action-count-light">
          <span>{count}</span>
        </div>
      )}
      <div className="admin-action-arrow-light">→</div>
    </button>
  ));

  const SystemAlert = React.memo(({ type, message, time }) => (
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
  ));

  const HealthMetric = React.memo(({ label, value, max = 100, color }) => (
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
  ));

  const calculateTrends = useMemo(() => {
    if (!stats) return {};
    
    return {
      total_users: { 
        value: '+15%', 
        direction: 'up' 
      },
      total_students: { 
        value: stats.total_students > 0 ? '+12%' : '0%', 
        direction: stats.total_students > 0 ? 'up' : 'stable' 
      },
      total_documents: { 
        value: stats.total_documents > 0 ? '+25%' : '0%', 
        direction: stats.total_documents > 0 ? 'up' : 'stable' 
      },
      unverified_documents: { 
        value: stats.unverified_documents > 0 ? '+8%' : '0%', 
        direction: stats.unverified_documents > 0 ? 'up' : 'stable' 
      },
      today_documents: { 
        value: stats.today_documents > 0 ? '+5%' : '0%', 
        direction: stats.today_documents > 0 ? 'up' : 'stable' 
      }
    };
  }, [stats]);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'manage-users':
        navigate('/users');
        break;
      case 'view-documents':
        navigate('/admin-documents');
        break;
      case 'view-notifications':
        setActiveTab('notifications');
        break;
      case 'reports':
        setActiveTab('analytics');
        break;
      case 'emergency-logout':
        handleEmergencyLogout();
        break;
      default:
        console.log('Unhandled action:', action);
    }
  };

  const handleExportWithMenu = () => {
    const exportTypes = [
      { value: 'users', label: '👥 Users', description: 'Complete user list' },
      { value: 'documents', label: '📁 Documents', description: 'All uploaded documents' },
      { value: 'notifications', label: '🔔 Notifications', description: 'Notification history' }
    ];
    
    const selectedType = window.prompt(
      'Choose data type to export:\n\n' +
      exportTypes.map(type => `${type.value}: ${type.label} - ${type.description}`).join('\n') +
      '\n\nEnter type (users, documents, notifications):',
      'users'
    );
    
    if (selectedType && ['users', 'documents', 'notifications'].includes(selectedType.toLowerCase())) {
      exportData(selectedType.toLowerCase());
    } else if (selectedType) {
      alert('Invalid export type. Choose from: users, documents, notifications');
    }
  };

  const handleEmergencyLogout = () => {
    if (window.confirm('Admin logout? This will redirect you to the login page.')) {
      onLogout?.();
    }
  };

  const handleStatCardClick = (type) => {
    switch (type) {
      case 'documents':
      case 'unverified':
        navigate('/admin-documents');
        break;
      case 'notifications':
        setActiveTab('notifications');
        break;
      case 'users':
        navigate('/users');
        break;
      default:
        break;
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
          <p>Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-light">
      {/* Admin Header */}
      <header className="admin-header-light">
        <div className="admin-header-background-light">
          <div className="admin-glow-1-light"></div>
          <div className="admin-glow-2-light"></div>
        </div>
        
        <div className="admin-header-content-light">
          <div className="admin-welcome-light">
            <h1>
              <span className="admin-title-light">Administrator Dashboard</span>
              <span className="admin-badge-light">👑</span>
            </h1>
            <p className="admin-subtitle-light">
              Complete CampusBourses system management
              <span className={`admin-status-light ${systemHealth.status}`}>
                {' '}• System: {systemHealth.status === 'healthy' ? 'Optimal' : 'Monitoring'}
              </span>
            </p>
          </div>
          
          <div className="admin-quick-stats-light">
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.total_students || 0}</span>
              <span className="quick-stat-label-light">Students</span>
            </div>
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.unverified_documents || 0}</span>
              <span className="quick-stat-label-light">To Verify</span>
            </div>
            <div className="quick-stat-item-light">
              <span className="quick-stat-value-light">{stats?.today_documents || 0}</span>
              <span className="quick-stat-label-light">Today</span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="admin-nav-light">
        <div className="admin-nav-container-light">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥', count: stats?.total_users },
            { id: 'documents', label: 'Documents', icon: '📁', count: stats?.unverified_documents },
            { id: 'notifications', label: 'Notifications', icon: '🔔', count: unreadCount },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-tab-light ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <div className="admin-tab-icon-light">{tab.icon}</div>
              <span className="admin-tab-label-light">{tab.label}</span>
              {tab.count > 0 && <span className="admin-tab-count-light">{tab.count}</span>}
              <div className="admin-tab-indicator-light"></div>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main-light">
        {activeTab === 'overview' && (
          <div className="admin-overview-grid-light">
            {/* Main Statistics Section */}
            <section className="admin-stats-section-light">
              <div className="admin-section-header-light">
                <h2>Global Metrics</h2>
                <div className="time-filter-admin-light">
                  <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </div>

              <div className="admin-stats-grid-light">
                <AdminStatCard
                  title="Total Users"
                  value={stats?.total_users || 0}
                  trend={calculateTrends.total_users}
                  icon="👥"
                  color="primary"
                  metric={{ 
                    value: stats?.total_users ? Math.round((stats.total_students / stats.total_users) * 100) : 0, 
                    label: 'Students' 
                  }}
                  onClick={() => handleStatCardClick('users')}
                />
                <AdminStatCard
                  title="Active Students"
                  value={stats?.total_students || 0}
                  trend={calculateTrends.total_students}
                  icon="🎓"
                  color="info"
                  onClick={() => handleStatCardClick('users')}
                />
                <AdminStatCard
                  title="Total Documents"
                  value={stats?.total_documents || 0}
                  trend={calculateTrends.total_documents}
                  icon="📁"
                  color="success"
                  onClick={() => handleStatCardClick('documents')}
                />
                <AdminStatCard
                  title="To Verify"
                  value={stats?.unverified_documents || 0}
                  trend={calculateTrends.unverified_documents}
                  icon="⏳"
                  color="warning"
                  onClick={() => handleStatCardClick('unverified')}
                />
                <AdminStatCard
                  title="Uploads Today"
                  value={stats?.today_documents || 0}
                  trend={calculateTrends.today_documents}
                  icon="📅"
                  color="info"
                  onClick={() => handleStatCardClick('documents')}
                />
                <AdminStatCard
                  title="Notifications"
                  value={unreadCount}
                  trend={{ value: unreadCount > 0 ? '+3%' : '0%', direction: unreadCount > 0 ? 'up' : 'stable' }}
                  icon="🔔"
                  color="secondary"
                  onClick={() => handleStatCardClick('notifications')}
                />
              </div>
            </section>

            {/* Quick Actions Section */}
            <section className="admin-actions-section-light">
              <h3>Administrative Actions</h3>
              <div className="admin-actions-grid-light">
                <AdminActionCard
                  title="Manage Users"
                  description="Complete user account management"
                  icon="👥"
                  color="primary"
                  count={stats?.total_users}
                  onClick={() => handleQuickAction('manage-users')}
                />
                <AdminActionCard
                  title="Verify Documents"
                  description="Student document validation"
                  icon="📁"
                  color="warning"
                  count={stats?.unverified_documents}
                  onClick={() => handleQuickAction('view-documents')}
                  disabled={!stats?.unverified_documents || stats.unverified_documents === 0}
                />
                <AdminActionCard
                  title="Notifications"
                  description="Manage alerts and notifications"
                  icon="🔔"
                  color="secondary"
                  count={unreadCount}
                  onClick={() => handleQuickAction('view-notifications')}
                  disabled={unreadCount === 0}
                />
                <AdminActionCard
                  title="Analytics Reports"
                  description="Detailed statistics and analysis"
                  icon="📈"
                  color="info"
                  onClick={() => handleQuickAction('reports')}
                />
              </div>
            </section>

            {/* Notifications Section */}
            <section className="admin-notifications-section-light">
              <div className="section-header-with-action">
                <h3>🔔 Recent Notifications</h3>
                <div className="notification-header-actions">
                  <span className="notification-badge">{unreadCount} unread</span>
                  {unreadCount > 0 && (
                    <button 
                      className="btn-mark-all-read"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              <div className="notifications-list-light">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <div className="no-notifications-light">
                    <div className="no-notifications-icon">🎉</div>
                    <p>No new notifications</p>
                    <span>All notifications are up to date</span>
                  </div>
                )}
              </div>
            </section>

            {/* System Health Section */}
            <section className="system-health-section-light">
              <h3>🖥️ System Health</h3>
              <div className="health-metrics-grid-light">
                <HealthMetric label="CPU" value={systemHealth.cpu} color="primary" />
                <HealthMetric label="Memory" value={systemHealth.memory} color="warning" />
                <HealthMetric label="Storage" value={systemHealth.storage} color="danger" />
                <HealthMetric label="Network" value={systemHealth.network} color="success" />
              </div>
              
              <div className="system-alerts-light">
                <h4>System Alerts</h4>
                <div className="alerts-list-light">
                  {alerts.map(alert => (
                    <SystemAlert key={alert.id} {...alert} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Notification Management</h2>
              <p>System notifications and recent activities</p>
            </div>
            
            <div className="notifications-full-section-light">
              <div className="notifications-header-light">
                <h3>All Notifications</h3>
                <div className="notifications-actions-light">
                  {unreadCount > 0 && (
                    <button 
                      className="btn-admin-secondary-light"
                      onClick={markAllAsRead}
                    >
                      📥 Mark all as read
                    </button>
                  )}
                  <button className="btn-admin-secondary-light" onClick={loadAdminData}>
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              <div className="notifications-full-list-light">
                {recentActivity.length > 0 ? (
                  recentActivity.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <div className="no-notifications-light">
                    <div className="no-notifications-icon">📋</div>
                    <p>No notifications in history</p>
                    <span>New notifications will appear here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>User Management</h2>
              <p>Complete user account administration</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">👥</div>
              <h3>Users Interface</h3>
              <p>Manage accounts, permissions and user access</p>
              <button 
                className="btn-admin-primary-light"
                onClick={() => navigate('/users')}
              >
                👥 Access user management
              </button>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>Document Management</h2>
              <p>Verification and validation of student documents</p>
            </div>
            <div className="admin-empty-state-light">
              <div className="admin-empty-icon-light">📁</div>
              <h3>Documents Interface</h3>
              <p>Review and verify documents uploaded by students</p>
              <button 
                className="btn-admin-primary-light"
                onClick={() => navigate('/admin-documents')}
              >
                📁 Verify documents
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content-admin-light">
            <div className="content-header-light">
              <h2>📊 Advanced Analytics</h2>
              <p>Detailed statistics and performance reports</p>
            </div>
            
            <div className="analytics-dashboard">
              {/* Main Metrics */}
              <div className="analytics-stats-grid">
                <div className="analytics-stat-card">
                  <div className="stat-icon">📁</div>
                  <div className="stat-content">
                    <h3>{analyticsData?.overview?.total_documents || 0}</h3>
                    <p>Total Documents</p>
                    <span className={`stat-trend ${analyticsData?.overview?.weekly_trend > 0 ? 'positive' : 'negative'}`}>
                      {analyticsData?.overview?.weekly_trend > 0 ? '+' : ''}{analyticsData?.overview?.weekly_trend?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="analytics-stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{analyticsData?.user_stats?.total_students || 0}</h3>
                    <p>Active Students</p>
                    <span className="stat-trend positive">+8%</span>
                  </div>
                </div>
                
                <div className="analytics-stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>{analyticsData?.overview?.unverified_documents || 0}</h3>
                    <p>Pending</p>
                    <span className="stat-trend warning">+5%</span>
                  </div>
                </div>
                
                <div className="analytics-stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{analyticsData?.overview?.verified_documents || 0}</h3>
                    <p>Verified Documents</p>
                    <span className="stat-trend positive">
                      {analyticsData?.overview?.verification_rate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts and Visualizations */}
              <div className="analytics-charts-grid">
                {/* Documents by Type Chart */}
                <div className="chart-container">
                  <h4>📈 Documents by Type</h4>
                  <div className="chart-content">
                    <div className="chart-bars">
                      {analyticsData?.documents_by_type && Object.entries(analyticsData.documents_by_type).map(([type, data]) => {
                        const typeLabels = {
                          'identity': "Identity Document",
                          'academic': "Academic Record", 
                          'financial': "Bank Statement",
                          'residence': "Proof of Residence",
                          'other': "Others"
                        };
                        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
                        
                        return (
                          <div key={type} className="chart-bar-item">
                            <div className="bar-label">
                              <span>{typeLabels[type] || type}</span>
                              <span>{data.count}</span>
                            </div>
                            <div className="bar-container">
                              <div 
                                className="bar-fill" 
                                style={{
                                  width: `${data.percentage}%`,
                                  backgroundColor: colors[Object.keys(analyticsData.documents_by_type).indexOf(type) % colors.length]
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Verification Status Chart */}
                <div className="chart-container">
                  <h4>✅ Verification Status</h4>
                  <div className="verification-chart">
                    <div className="verification-stats">
                      <div className="verification-item verified">
                        <div className="verification-dot"></div>
                        <span>Verified: {analyticsData?.overview?.verified_documents || 0}</span>
                      </div>
                      <div className="verification-item pending">
                        <div className="verification-dot"></div>
                        <span>Pending: {analyticsData?.overview?.unverified_documents || 0}</span>
                      </div>
                    </div>
                    <div className="verification-chart-visual">
                      <div 
                        className="chart-circle verified"
                        style={{ 
                          clipPath: `inset(0 ${100 - (analyticsData?.overview?.verification_rate || 0)}% 0 0)` 
                        }}
                      ></div>
                      <div 
                        className="chart-circle pending"
                        style={{ 
                          clipPath: `inset(0 0 0 ${analyticsData?.overview?.verification_rate || 0}%)` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="chart-container full-width">
                  <h4>📅 Last 7 Days Activity</h4>
                  <div className="activity-chart">
                    {analyticsData?.daily_activity?.map((day, index) => (
                      <div key={index} className="activity-day">
                        <div className="day-label">{day.day}</div>
                        <div className="day-bar-container">
                          <div 
                            className="day-bar" 
                            style={{ 
                              height: `${Math.min(day.count * 10, 100)}%`,
                              backgroundColor: day.count > 0 ? '#3498db' : '#e0e0e0'
                            }}
                            title={`${day.count} documents on ${day.date}`}
                          ></div>
                        </div>
                        <div className="day-count">{day.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="chart-container">
                  <h4>⚡ Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Average verification time</span>
                      <span className="metric-value">
                        {analyticsData?.performance_metrics?.average_verification_time || 0}h
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Rejection rate</span>
                      <span className="metric-value">
                        {analyticsData?.performance_metrics?.rejection_rate || 0}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">User satisfaction</span>
                      <span className="metric-value">
                        {analyticsData?.performance_metrics?.user_satisfaction || 0}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">System availability</span>
                      <span className="metric-value">
                        {analyticsData?.performance_metrics?.system_availability || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Analytics Actions */}
              <div className="analytics-actions">
                <button 
                  className="btn-admin-primary-light" 
                  onClick={generateReport}
                  disabled={loading}
                >
                  {loading ? '⏳' : '📊'} Generate full report
                </button>
                
                <button 
                  className="btn-admin-secondary-light" 
                  onClick={generatePDFReport}
                  disabled={loading}
                >
                  {loading ? '⏳' : '📄'} PDF report
                </button>
                
                <button 
                  className="btn-admin-secondary-light" 
                  onClick={handleExportWithMenu}
                  disabled={loading}
                >
                  {loading ? '⏳' : '📥'} Export data
                </button>
                
                <button 
                  className="btn-admin-secondary-light" 
                  onClick={loadAnalyticsData}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Footer */}
      <footer className="admin-footer-light">
        <div className="admin-footer-content-light">
          <p>© 2024 CampusBourses - Administration Panel</p>
          <div className="admin-footer-links-light">
            <span className="admin-user-light">Logged in as: {user?.username}</span>
            <button 
              className="admin-footer-link-light"
              onClick={() => handleQuickAction('emergency-logout')}
            >
              🔒 Admin Logout
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;