import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

interface DatabaseBackupRestoreModalProps {
  showRestoreModal: boolean;
  loading: boolean;
  onRestoreConfirm: (backupPath: string) => void;
  onRestoreCancel: () => void;
}

export const DatabaseBackupRestoreModal: React.FC<DatabaseBackupRestoreModalProps> = ({
  showRestoreModal,
  loading,
  onRestoreConfirm,
  onRestoreCancel,
}) => {
  const [restorePath, setRestorePath] = useState('/ccb/salz8-3/avaraby1/CHESS_WEB/CHESSApp_prod_backups/backup_2025-12-04_01-02-48');

  // Reset state when modal closes
  useEffect(() => {
    if (!showRestoreModal) {
      setRestorePath('/ccb/salz8-3/avaraby1/CHESS_WEB/CHESSApp_prod_backups/backup_2025-12-04_01-02-48');
    }
  }, [showRestoreModal]);

  const handleRestoreConfirm = () => {
    if (restorePath.trim()) {
      onRestoreConfirm(restorePath);
    }
  };

  return (
    <Modal show={showRestoreModal} onHide={onRestoreCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Restore Database</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Restoring backup...</span>
            </Spinner>
            <p className="mt-3 text-muted">Restoring database from backup, please wait...</p>
          </div>
        ) : (
          <>
            <Alert variant="warning">
              <i className="fas fa-exclamation-triangle me-2" />
              <strong>Warning:</strong> This will restore the database from a backup and overwrite existing data.
            </Alert>
            <Form.Group controlId="restorePath">
              <Form.Label>Backup Directory Path</Form.Label>
              <Form.Control
                type="text"
                value={restorePath}
                onChange={(e) => setRestorePath(e.target.value)}
                placeholder="e.g., /path/to/backup_directory"
                disabled={loading}
                autoComplete="off"
                name="restorePath"
              />
              <Form.Text className="text-muted">
                Enter the absolute path to the backup directory to restore from.
              </Form.Text>
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onRestoreCancel} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="warning" 
          onClick={handleRestoreConfirm} 
          disabled={loading || !restorePath.trim()}
        >
          {loading ? 'Restoring...' : 'Restore from Backup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};