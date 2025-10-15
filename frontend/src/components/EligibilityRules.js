import React, { useState, useEffect } from 'react';
import api from '../api';
import './EligibilityRules.css';

const EligibilityRules = ({ user }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rule_type: 'academic',
    criteria: {},
    is_active: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get('/users/eligibility-rules/');
      setRules(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des règles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingRule) {
        // Modification
        await api.put(`/users/eligibility-rules/${editingRule.id}/`, formData);
      } else {
        // Création
        await api.post('/users/eligibility-rules/create/', formData);
      }
      
      setShowForm(false);
      setEditingRule(null);
      setFormData({
        title: '',
        description: '',
        rule_type: 'academic',
        criteria: {},
        is_active: true
      });
      fetchRules();
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      title: rule.title,
      description: rule.description,
      rule_type: rule.rule_type,
      criteria: rule.criteria,
      is_active: rule.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        await api.delete(`/users/eligibility-rules/${ruleId}/`);
        fetchRules();
      } catch (error) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const ruleTypeIcons = {
    academic: '🎓',
    financial: '💰',
    administrative: '📋'
  };

  const ruleTypeLabels = {
    academic: 'Académique',
    financial: 'Financière',
    administrative: 'Administrative'
  };

  if (loading) {
    return (
      <div className="rules-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des règles d'éligibilité...</p>
      </div>
    );
  }

  return (
    <div className="eligibility-rules">
      <div className="rules-header">
        <h1>📋 Règles d'Éligibilité</h1>
        <p>Gestion des critères d'éligibilité aux bourses</p>
        
        {user?.user_type === 'admin' && !showForm && (
          <button 
            className="btn-add-rule"
            onClick={() => setShowForm(true)}
          >
            ➕ Ajouter une règle
          </button>
        )}
      </div>

      {error && (
        <div className="rules-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* Formulaire (Admin seulement) */}
      {user?.user_type === 'admin' && showForm && (
        <div className="rule-form-section">
          <h2>{editingRule ? 'Modifier la règle' : 'Nouvelle règle'}</h2>
          <form onSubmit={handleSubmit} className="rule-form">
            <div className="form-group">
              <label>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type de règle</label>
                <select
                  value={formData.rule_type}
                  onChange={(e) => setFormData({...formData, rule_type: e.target.value})}
                >
                  <option value="academic">Académique</option>
                  <option value="financial">Financière</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>

              <div className="form-group">
                <label>Statut</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    id="is_active"
                  />
                  <label htmlFor="is_active">Règle active</label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingRule ? '💾 Modifier' : '➕ Créer'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                  setFormData({
                    title: '',
                    description: '',
                    rule_type: 'academic',
                    criteria: {},
                    is_active: true
                  });
                }}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des règles */}
      <div className="rules-grid">
        {rules.length === 0 ? (
          <div className="no-rules">
            <div className="no-rules-icon">📝</div>
            <h3>Aucune règle d'éligibilité</h3>
            <p>Les règles d'éligibilité apparaîtront ici</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`rule-card ${rule.is_active ? 'active' : 'inactive'}`}>
              <div className="rule-header">
                <div className="rule-type">
                  <span className="rule-icon">{ruleTypeIcons[rule.rule_type]}</span>
                  <span className="rule-type-label">{ruleTypeLabels[rule.rule_type]}</span>
                </div>
                <div className="rule-status">
                  <span className={`status-badge ${rule.is_active ? 'active' : 'inactive'}`}>
                    {rule.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>

              <div className="rule-content">
                <h3>{rule.title}</h3>
                <p className="rule-description">{rule.description}</p>
                
                <div className="rule-meta">
                  <div className="meta-item">
                    <span className="meta-label">Créée par:</span>
                    <span className="meta-value">{rule.created_by_name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">
                      {new Date(rule.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Admin */}
              {user?.user_type === 'admin' && (
                <div className="rule-actions">
                  <button 
                    className="btn-action edit"
                    onClick={() => handleEdit(rule)}
                  >
                    ✏️ Modifier
                  </button>
                  <button 
                    className="btn-action delete"
                    onClick={() => handleDelete(rule.id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EligibilityRules;