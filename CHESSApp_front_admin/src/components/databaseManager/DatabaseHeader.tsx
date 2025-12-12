import React from 'react';
import { Button } from 'react-bootstrap';

interface DatabaseHeaderProps {
  onResetDatabase: () => void;
  onBackupDatabase: () => void;
  onRestoreDatabase: () => void;
  loading: boolean;
}

export const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({ 
  onResetDatabase,
  onBackupDatabase,
  onRestoreDatabase,
  loading 
}) => (
  <div className="mb-4">
    <h2>Database Management</h2>
    <div className="mb-3 d-flex gap-2">
      <Button 
        variant="success" 
        onClick={onBackupDatabase}
        disabled={loading}
      >
        <i className="fas fa-download me-2" />
        Backup DB
      </Button>
      <Button 
        variant="info" 
        onClick={onRestoreDatabase}
        disabled={loading}
      >
        <i className="fas fa-upload me-2" />
        Restore DB from Backup
      </Button>
      <Button 
        variant="danger" 
        onClick={onResetDatabase}
        disabled={loading}
      >
        <i className="fas fa-trash me-2" />
        Reset Database
      </Button>
    </div>
  </div>
);