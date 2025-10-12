import React from 'react';
import './UserAnalytics.css';

const UserAnalytics = ({ user, stats }) => {
  return (
    <div className="user-analytics">
      <h2>📈 Analytics Détaillés</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Performance des Demandes</h3>
          {/* Graphique des performances */}
        </div>
        
        <div className="analytics-card">
          <h3>Répartition des Bourses</h3>
          {/* Graphique circulaire */}
        </div>
        
        <div className="analytics-card">
          <h3>Évolution Temporelle</h3>
          {/* Graphique linéaire */}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;