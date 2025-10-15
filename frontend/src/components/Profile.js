// src/components/Profile.js - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

const Profile = ({ user, onUserUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadUserStats();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfile(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setMessage('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      let userStats = {};
      
      if (user.user_type === 'student') {
        // Récupérer les statistiques de l'étudiant
        const docsResponse = await api.get('/users/documents/');
        const documents = docsResponse.data || [];
        
        userStats = {
          total_documents: documents.length,
          verified_documents: documents.filter(doc => doc.is_verified).length,
          pending_documents: documents.filter(doc => !doc.is_verified).length
        };
      } else if (user.user_type === 'admin') {
        // Récupérer les statistiques de l'admin
        const statsResponse = await api.get('/users/admin/stats/');
        const adminStats = statsResponse.data;
        
        userStats = {
          total_users: adminStats.total_users || 0,
          total_students: adminStats.total_students || 0,
          verified_documents: (adminStats.total_documents || 0) - (adminStats.unverified_documents || 0),
          total_documents: adminStats.total_documents || 0
        };
      }
      
      setStats(userStats);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      // Statistiques par défaut en cas d'erreur
      setStats({
        total_documents: 0,
        verified_documents: 0,
        pending_documents: 0,
        total_users: 0,
        total_students: 0
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Simulation de mise à jour - À remplacer par votre API réelle
      const updatedUser = {
        ...user,
        ...formData
      };
      
      // Ici, vous appelleriez votre vraie API :
      // const response = await api.put('/api/users/me/', formData);
      
      setProfile(updatedUser);
      onUserUpdate?.(updatedUser);
      setEditing(false);
      setMessage('Profil mis à jour avec succès!');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      setMessage('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      date_of_birth: user.date_of_birth || '',
    });
    setEditing(false);
    setMessage('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>
        <h1>👤 Mon Profil</h1>
        <div className="profile-actions">
          {!editing ? (
            <button 
              className="btn-edit"
              onClick={() => setEditing(true)}
            >
              ✏️ Modifier
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn-cancel"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Annuler
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? '⏳' : '💾'} Sauvegarder
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`profile-message ${message.includes('Erreur') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="profile-basic-info">
              <h2>{profile?.first_name} {profile?.last_name}</h2>
              <p className="profile-role">
                {profile?.user_type === 'admin' ? '👑 Administrateur' : '🎓 Étudiant'}
              </p>
              <p className="profile-username">@{profile?.username}</p>
            </div>
          </div>

          <div className="profile-details">
            <h3>Informations Personnelles</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                {editing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                  />
                ) : (
                  <div className="profile-field">{profile?.first_name || 'Non renseigné'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Nom</label>
                {editing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                  />
                ) : (
                  <div className="profile-field">{profile?.last_name || 'Non renseigné'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Votre email"
                  />
                ) : (
                  <div className="profile-field">{profile?.email}</div>
                )}
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Votre numéro de téléphone"
                  />
                ) : (
                  <div className="profile-field">{profile?.phone_number || 'Non renseigné'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Date de naissance</label>
                {editing ? (
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="profile-field">
                    {formatDate(profile?.date_of_birth)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Statut du compte</label>
                <div className="profile-field status-active">
                  ✅ Actif
                </div>
              </div>
            </div>
          </div>

          <div className="profile-stats">
            <h3>Statistiques</h3>
            <div className="stats-grid">
              {profile?.user_type === 'student' && (
                <>
                  <div className="stat-item">
                    <span className="stat-number">{stats.total_documents || 0}</span>
                    <span className="stat-label">Documents uploadés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.verified_documents || 0}</span>
                    <span className="stat-label">Documents vérifiés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.pending_documents || 0}</span>
                    <span className="stat-label">En attente</span>
                  </div>
                </>
              )}
              {profile?.user_type === 'admin' && (
                <>
                  <div className="stat-item">
                    <span className="stat-number">{stats.total_users || 0}</span>
                    <span className="stat-label">Utilisateurs totaux</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.total_students || 0}</span>
                    <span className="stat-label">Étudiants</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.verified_documents || 0}</span>
                    <span className="stat-label">Documents vérifiés</span>
                  </div>
                </>
              )}
              <div className="stat-item">
                <span className="stat-number">
                  {formatDate(profile?.date_joined || profile?.created_at)}
                </span>
                <span className="stat-label">Membre depuis</span>
              </div>
            </div>
          </div>

          {/* Bouton pour rafraîchir les statistiques */}
          <div className="profile-actions-bottom">
            <button 
              className="btn-refresh"
              onClick={loadUserStats}
              title="Rafraîchir les statistiques"
            >
              🔄 Actualiser les statistiques
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;