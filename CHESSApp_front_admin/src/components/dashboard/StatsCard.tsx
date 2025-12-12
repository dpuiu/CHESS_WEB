import React from 'react';
import { Col } from 'react-bootstrap';

export const StatsCard: React.FC<{ 
  count: number; 
  label: string; 
  variant: 'primary' | 'success' | 'secondary' | 'danger' | 'info' | 'warning';
  icon?: string;
}> = ({ count, label, variant, icon }) => (
  <Col md={2} sm={4} className="mb-3">
    <div className="text-center">
      <h3 className={`text-${variant}`}>
        {icon && <i className={`${icon} me-2`} />}
        {count.toLocaleString()}
      </h3>
      <p className="text-muted">{label}</p>
    </div>
  </Col>
);