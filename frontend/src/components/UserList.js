// src/components/UserList.js - CORRECTED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Charger les utilisateurs
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/users/all/');
      
      // S'assurer que les données sont bien formatées
      const usersData = Array.isArray(response.data) ? response.data : [];
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Recherche avec gestion sécurisée
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    // Filtrer avec vérifications de sécurité
    const filtered = users.filter(user => {
      if (!user || typeof user !== 'object') return false;
      
      const username = user.username || '';
      const email = user.email || '';
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      
      return username.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             firstName.toLowerCase().includes(searchLower) ||
             lastName.toLowerCase().includes(searchLower);
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await api.delete(`/users/delete/${userId}/`);
      
      // Mettre à jour les listes de manière immuable
      setUsers(prev => prev.filter(user => user.id !== userId));
      setFilteredUsers(prev => prev.filter(user => user.id !== userId));
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Gestion sécurisée de la recherche
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  if (loading) {
    return (
      <div className="user-list-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h1>Gestion des Utilisateurs</h1>
        <p>Administration complète des comptes utilisateurs</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      <div className="user-list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="user-stats">
          <span>{filteredUsers.length} utilisateur(s) trouvé(s)</span>
        </div>
      </div>

      <div className="user-list-content">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <div className="no-users-icon">👥</div>
            <h3>Aucun utilisateur trouvé</h3>
            <p>
              {searchTerm 
                ? 'Aucun utilisateur ne correspond à votre recherche' 
                : 'Aucun utilisateur dans le système'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Nom Complet</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="user-row">
                    <td>
                      <div className="user-avatar">
                        <div className="avatar-placeholder">
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                          <strong>{user.username || 'N/A'}</strong>
                          <small>ID: {user.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'Non renseigné'
                      }
                    </td>
                    <td>
                      <span className={`user-type-badge ${user.user_type}`}>
                        {user.user_type === 'admin' ? '👑 Admin' : '🎓 Étudiant'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          className="btn-danger"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.user_type === 'admin'}
                          title={user.user_type === 'admin' ? 'Impossible de supprimer un admin' : 'Supprimer l\'utilisateur'}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="user-list-footer">
        <p>
          <strong>Total:</strong> {users.length} utilisateur(s) dans le système | 
          <strong> Affichés:</strong> {filteredUsers.length}
        </p>
        <button onClick={loadUsers} className="btn-refresh">
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default UserList;