import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

interface DatabaseCreateBackupModalProps {
  showCreateBackupModal: boolean;
  initialBackupDirPath: string | null;
  loading: boolean;
  onCreateBackupConfirm: (backupDirPath: string) => void;
  onCreateBackupCancel: () => void;
}

export const DatabaseCreateBackupModal: React.FC<DatabaseCreateBackupModalProps> = ({
  showCreateBackupModal,
  initialBackupDirPath,
  loading,
  onCreateBackupConfirm,
  onCreateBackupCancel,
}) => {
  const [backupDirPath, setBackupDirPath] = useState(initialBackupDirPath || '/ccb/salz8-3/avaraby1/CHESS_WEB/CHESSApp_prod_backups');

  // Update local state when prop changes
  useEffect(() => {
    setBackupDirPath(initialBackupDirPath || '/ccb/salz8-3/avaraby1/CHESS_WEB/CHESSApp_prod_backups');
  }, [initialBackupDirPath]);

  const handleConfirm = () => {
    onCreateBackupConfirm(backupDirPath);
  };

  return (
    <Modal show={showCreateBackupModal} onHide={onCreateBackupCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Create Full Database Backup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group controlId="backupDirPath">
          <Form.Label>Backup Directory Path</Form.Label>
          <Form.Control
            type="text"
            value={backupDirPath}
            onChange={(e) => setBackupDirPath(e.target.value)}
            placeholder="/ccb/salz8-3/avaraby1/CHESS_WEB/CHESSApp_prod_backups"
            disabled={loading}
            autoComplete="on"
            name="backupDirPath"
          />
          <Form.Text className="text-muted">
            Enter the absolute path where the backup should be created.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCreateBackupCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm} 
          disabled={loading || !backupDirPath.trim()}
        >
          {loading ? 'Creating...' : 'Yes, Create Backup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};