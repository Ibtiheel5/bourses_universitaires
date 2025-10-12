import React, { useState, useEffect } from 'react';
import api from '../api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="container loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestion des Utilisateurs</h1>
      {error && <div className="alert alert-error">{error}</div>}
      
      {users.length === 0 ? (
        <div className="alert alert-info">
          Aucun utilisateur trouvé dans le système.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom d'utilisateur</th>
              <th>Email</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.first_name || '-'}</td>
                <td>{user.last_name || '-'}</td>
                <td>
                  <span className={`user-type-badge ${user.user_type}`}>
                    {user.user_type === 'admin' ? 'Administrateur' : 'Étudiant'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(user.id)}
                    disabled={user.user_type === 'admin'} // Empêcher la suppression des admins
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .user-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .user-type-badge.admin {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .user-type-badge.student {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .alert-info {
          background: #dbeafe;
          color: #1e40af;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #93c5fd;
        }
      `}</style>
    </div>
  );
};

export default UserList;