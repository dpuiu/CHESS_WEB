import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

interface DatabaseBackupRestoreModalProps {
  showRestoreModal: boolean;
  loading: boolean;
  onRestoreConfirm: (backupPath: string, storageDirPath: string) => void;
  onRestoreCancel: () => void;
}

export const DatabaseBackupRestoreModal: React.FC<DatabaseBackupRestoreModalProps> = ({
  showRestoreModal,
  loading,
  onRestoreConfirm,
  onRestoreCancel,
}) => {
  const [restorePath, setRestorePath] = useState('/Users/sparrow/JHU/CHESS_WEB/backup_2025-12-21_22-53-30');
  const [storageDirPath, setStorageDirPath] = useState('/Users/sparrow/JHU/CHESS_WEB/CHESS_WEB/CHESSApp_data');
  
  // Reset state when modal closes
  useEffect(() => {
    if (!showRestoreModal) {
      setRestorePath('/Users/sparrow/JHU/CHESS_WEB/backup_2025-12-21_22-53-30');
      setStorageDirPath('/Users/sparrow/JHU/CHESS_WEB/CHESS_WEB/CHESSApp_data');
    }
  }, [showRestoreModal]);

  const handleRestoreConfirm = () => {
    if (restorePath.trim() && storageDirPath.trim()) {
      onRestoreConfirm(restorePath, storageDirPath);
    }
  };

  return (
    <Modal show={showRestoreModal} onHide={loading ? undefined : onRestoreCancel} backdrop={loading ? 'static' : true} keyboard={!loading}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>{loading ? 'Restoring Database...' : 'Restore Database'}</Modal.Title>
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
            <Form.Group controlId="storageDirPath" className="mt-3">
              <Form.Label>Database Storage Directory Path</Form.Label>
              <Form.Control
                type="text"
                value={storageDirPath}
                onChange={(e) => setStorageDirPath(e.target.value)}
                placeholder="e.g., /path/to/database_storage_directory"
                disabled={loading}
                autoComplete="off"
                name="storageDirPath"
              />
              <Form.Text className="text-muted">
                Enter the absolute path to the database storage directory.
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