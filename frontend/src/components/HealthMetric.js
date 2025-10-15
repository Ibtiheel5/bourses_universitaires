import React from 'react';

const HealthMetric = ({ label, value, color = 'primary' }) => {
  return (
    <div className={`health-metric ${color}`}>
      <div className="metric-value-circle">
        {value}%
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
};

export default HealthMetric;