// src/components/UserList.js (Version Premium)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all/');
      setUsers(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Erreur détaillée:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await api.delete(`/users/delete/${userId}/`);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        setError('Erreur lors de la suppression');
        console.error('Erreur détaillée:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="user-list-loading">
        <div className="loading-spinner-large"></div>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="user-list-premium">
      <div className="user-list-header">
        <h1>👥 Gestion des Utilisateurs</h1>
        <p>Administrez les comptes utilisateurs de la plateforme</p>
      </div>

      <div className="user-list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            <option value="student">Étudiants</option>
            <option value="admin">Administrateurs</option>
          </select>
          
          <span className="user-count">
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="user-list-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      )}
      
      {filteredUsers.length === 0 ? (
        <div className="user-list-empty">
          <div className="empty-icon">👥</div>
          <h3>Aucun utilisateur trouvé</h3>
          <p>Aucun utilisateur ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="user-list-table-container">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="user-row">
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.first_name && user.last_name 
                          ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                          : user.username[0].toUpperCase()
                        }
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-contact">
                      <div className="user-email">{user.email}</div>
                      {user.phone_number && (
                        <div className="user-phone">{user.phone_number}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`user-type-badge ${user.user_type}`}>
                      {user.user_type === 'admin' ? '👑 Administrateur' : '🎓 Étudiant'}
                    </span>
                  </td>
                  <td>
                    <span className={`user-status ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button className="btn-action view" title="Voir le profil">
                        👁️
                      </button>
                      <button className="btn-action edit" title="Modifier">
                        ✏️
                      </button>
                      <button 
                        className="btn-action delete" 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.user_type === 'admin'}
                        title={user.user_type === 'admin' ? 'Impossible de supprimer un admin' : 'Supprimer'}
                      >
                        🗑️
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
  );
};

export default UserList;