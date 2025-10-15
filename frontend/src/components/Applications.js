// src/components/Applications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    scholarship_type: 'merit',
    title: '',
    description: '',
    amount_requested: ''
  });

  const SCHOLARSHIP_TYPES = [
    { value: 'merit', label: 'Bourse au Mérite', icon: '⭐', description: 'Basée sur les résultats académiques' },
    { value: 'social', label: 'Bourse Sociale', icon: '🤝', description: 'Basée sur les critères sociaux' },
    { value: 'excellence', label: 'Bourse d\'Excellence', icon: '🏆', description: 'Pour les étudiants excellents' },
    { value: 'sport', label: 'Bourse Sportive', icon: '⚽', description: 'Pour les sportifs de haut niveau' },
    { value: 'international', label: 'Bourse Internationale', icon: '🌍', description: 'Pour les échanges internationaux' },
    { value: 'research', label: 'Bourse de Recherche', icon: '🔬', description: 'Pour les projets de recherche' }
  ];

  const STATUS_CONFIG = {
    draft: { label: 'Brouillon', color: '#6c757d', icon: '📝' },
    submitted: { label: 'Soumise', color: '#0dcaf0', icon: '📤' },
    under_review: { label: 'En examen', color: '#ffc107', icon: '🔍' },
    approved: { label: 'Approuvée', color: '#198754', icon: '✅' },
    rejected: { label: 'Rejetée', color: '#dc3545', icon: '❌' },
    needs_info: { label: 'Infos requises', color: '#0d6efd', icon: 'ℹ️' }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/applications/');
      setApplications(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      draft: apps.filter(app => app.status === 'draft').length,
      submitted: apps.filter(app => app.status === 'submitted').length,
      under_review: apps.filter(app => app.status === 'under_review').length,
      approved: apps.filter(app => app.status === 'approved').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      needs_info: apps.filter(app => app.status === 'needs_info').length,
      total_amount: apps.reduce((sum, app) => sum + parseFloat(app.amount_requested || 0), 0),
      approved_amount: apps.reduce((sum, app) => sum + parseFloat(app.final_amount || 0), 0)
    };
    setStats(stats);
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/applications/', {
        ...formData,
        amount_requested: parseFloat(formData.amount_requested)
      });
      
      setApplications(prev => [response.data, ...prev]);
      setShowCreateForm(false);
      resetForm();
      alert('Demande créée avec succès!');
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Erreur lors de la création de la demande');
    }
  };

  const handleSubmitApplication = async (applicationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir soumettre cette demande ? Elle ne pourra plus être modifiée.')) {
      return;
    }

    try {
      const response = await api.post(`/users/applications/${applicationId}/submit/`);
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? response.data.application : app
      ));
      alert('Demande soumise avec succès!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Erreur lors de la soumission de la demande');
    }
  };

  const handleUpdateApplication = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/users/applications/${editingApplication.id}/`, {
        ...formData,
        amount_requested: parseFloat(formData.amount_requested)
      });
      
      setApplications(prev => prev.map(app => 
        app.id === editingApplication.id ? response.data : app
      ));
      setEditingApplication(null);
      resetForm();
      alert('Demande mise à jour avec succès!');
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Erreur lors de la mise à jour de la demande');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      await api.delete(`/users/applications/${applicationId}/`);
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      alert('Demande supprimée avec succès!');
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Erreur lors de la suppression de la demande');
    }
  };

  const resetForm = () => {
    setFormData({
      scholarship_type: 'merit',
      title: '',
      description: '',
      amount_requested: ''
    });
  };

  const startEditing = (application) => {
    setEditingApplication(application);
    setFormData({
      scholarship_type: application.scholarship_type,
      title: application.title,
      description: application.description,
      amount_requested: application.amount_requested
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingApplication(null);
    resetForm();
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div className="application-stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-title">{title}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  const ApplicationCard = ({ application }) => (
    <div className="application-card">
      <div className="application-header">
        <div className="application-title-section">
          <h3>{application.title}</h3>
          <span 
            className="status-badge"
            style={{ backgroundColor: STATUS_CONFIG[application.status].color }}
          >
            {STATUS_CONFIG[application.status].icon} {STATUS_CONFIG[application.status].label}
          </span>
        </div>
        <div className="application-type">
          {SCHOLARSHIP_TYPES.find(type => type.value === application.scholarship_type)?.icon}
          {application.scholarship_type_display}
        </div>
      </div>

      <div className="application-content">
        <p className="application-description">{application.description}</p>
        
        <div className="application-details">
          <div className="detail-item">
            <span className="detail-label">Montant demandé:</span>
            <span className="detail-value">{parseFloat(application.amount_requested).toLocaleString()} €</span>
          </div>
          {application.final_amount && (
            <div className="detail-item">
              <span className="detail-label">Montant accordé:</span>
              <span className="detail-value success">{parseFloat(application.final_amount).toLocaleString()} €</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Soumis le:</span>
            <span className="detail-value">
              {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Non soumis'}
            </span>
          </div>
        </div>

        {application.decision_notes && (
          <div className="decision-notes">
            <strong>Notes du comité:</strong>
            <p>{application.decision_notes}</p>
          </div>
        )}
      </div>

      <div className="application-actions">
        {application.can_edit && (
          <>
            <button 
              className="btn btn-primary"
              onClick={() => startEditing(application)}
            >
              ✏️ Modifier
            </button>
            <button 
              className="btn btn-success"
              onClick={() => handleSubmitApplication(application.id)}
            >
              📤 Soumettre
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => handleDeleteApplication(application.id)}
            >
              🗑️ Supprimer
            </button>
          </>
        )}
        {application.status === 'needs_info' && (
          <button 
            className="btn btn-warning"
            onClick={() => startEditing(application)}
          >
            🔄 Mettre à jour
          </button>
        )}
        {!application.can_edit && (
          <span className="text-muted">En lecture seule</span>
        )}
      </div>

      <div className="application-footer">
        <span className="time-ago">Créée {application.time_ago}</span>
        {application.reviewed_by_name && (
          <span className="reviewed-by">Traité par: {application.reviewed_by_name}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="applications-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos demandes...</p>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h1>📝 Mes Demandes de Bourse</h1>
        <p>Gérez vos demandes de bourse universitaires</p>
      </div>

      {/* Statistiques */}
      <div className="applications-stats">
        <StatCard 
          title="Total des demandes" 
          value={stats.total} 
          color="#0d6efd" 
          icon="📋"
        />
        <StatCard 
          title="En attente" 
          value={stats.submitted + stats.under_review} 
          color="#ffc107" 
          icon="⏳"
        />
        <StatCard 
          title="Approuvées" 
          value={stats.approved} 
          color="#198754" 
          icon="✅"
          subtitle={`${stats.approved_amount.toLocaleString()} €`}
        />
        <StatCard 
          title="Montant total demandé" 
          value={`${stats.total_amount.toLocaleString()} €`} 
          color="#6f42c1" 
          icon="💰"
        />
      </div>

      {/* Bouton de création */}
      <div className="applications-actions">
        <button 
          className="btn-create-application"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Nouvelle Demande
        </button>
      </div>

      {/* Formulaire de création/édition */}
      {showCreateForm && (
        <div className="application-form-overlay">
          <div className="application-form">
            <h2>{editingApplication ? 'Modifier la demande' : 'Nouvelle demande de bourse'}</h2>
            
            <form onSubmit={editingApplication ? handleUpdateApplication : handleCreateApplication}>
              <div className="form-group">
                <label>Type de bourse *</label>
                <select 
                  value={formData.scholarship_type}
                  onChange={(e) => setFormData({...formData, scholarship_type: e.target.value})}
                  required
                >
                  {SCHOLARSHIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Titre de la demande *</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Demande de bourse au mérite 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez votre situation, vos motivations, vos projets..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Montant demandé (€) *</label>
                <input 
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => setFormData({...formData, amount_requested: e.target.value})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingApplication ? '💾 Mettre à jour' : '📝 Créer la demande'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                  ❌ Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des demandes */}
      <div className="applications-list">
        {applications.length === 0 ? (
          <div className="no-applications">
            <div className="no-applications-icon">📋</div>
            <h3>Aucune demande de bourse</h3>
            <p>Commencez par créer votre première demande de bourse</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Créer ma première demande
            </button>
          </div>
        ) : (
          applications.map(application => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </div>
    </div>
  );
};

export default Applications;