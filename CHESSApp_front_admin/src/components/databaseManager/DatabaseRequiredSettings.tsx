import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { updateDatabaseConfig } from '../../redux/databaseConfig/databaseConfigThunks';

interface DatabaseRequiredSettingsProps {
  loading: boolean;
}

export const DatabaseRequiredSettings: React.FC<DatabaseRequiredSettingsProps> = ({ 
  loading 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data_dir, loading: configLoading, error: configError } = useSelector((state: RootState) => state.databaseConfig);
  
  const [dataDir, setDataDir] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (data_dir) {
      setDataDir(data_dir);
    }
  }, [data_dir]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await dispatch(updateDatabaseConfig({ data_dir: dataDir })).unwrap();
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update database configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConfigured = data_dir && data_dir.trim() !== '';

  if (loading || configLoading) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-cog me-2" />
            Database Configuration
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <i className="fas fa-cog me-2" />
          Database Configuration
          {isConfigured && (
            <span className="badge bg-success ms-2">
              <i className="fas fa-check me-1" />
              Configured
            </span>
          )}
        </h5>
      </Card.Header>
      <Card.Body>
        {configError && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2" />
            {configError}
          </Alert>
        )}

        {submitSuccess && (
          <Alert variant="success" className="mb-3">
            <i className="fas fa-check-circle me-2" />
            Database configuration updated successfully!
          </Alert>
        )}

        {submitError && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2" />
            {submitError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Data Directory</strong>
            </Form.Label>
            <Form.Control
              type="text"
              value={dataDir}
              onChange={(e) => setDataDir(e.target.value)}
              placeholder="Enter the path to the data directory"
              required
              disabled={isSubmitting}
            />
            <Form.Text className="text-muted">
              Please enter the absolute path to the data directory where CHESS data files are stored.
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isSubmitting || !dataDir.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2" />
                Save Configuration
              </>
            )}
          </Button>
        </Form>

        {isConfigured && (
          <Alert variant="info" className="mt-3 mb-0">
            <i className="fas fa-info-circle me-2" />
            <strong>Current Data Directory:</strong> {data_dir}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};