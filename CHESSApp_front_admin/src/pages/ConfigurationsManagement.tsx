import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useCreateConfigurationMutation,
  useUpdateConfigurationMutation,
  useDeleteConfigurationMutation,
  useActivateConfigurationMutation
} from '../redux/api/apiSlice';
import { Configuration } from '../types';
import { ConfigurationFormModal } from '../components/configurationManager';

const ConfigurationsManagement: React.FC = () => {
  // RTK Query Hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [createConfiguration, { isLoading: isCreating }] = useCreateConfigurationMutation();
  const [updateConfiguration, { isLoading: isUpdating }] = useUpdateConfigurationMutation();
  const [deleteConfiguration, { isLoading: isDeleting }] = useDeleteConfigurationMutation();
  const [activateConfiguration, { isLoading: isActivating }] = useActivateConfigurationMutation();

  const configurations = globalData?.configurations || {};
  const organisms = globalData?.organisms || {};
  const assemblies = globalData?.assemblies || {};
  const sources = globalData?.sources || {};

  // Convert data to arrays for easier use
  const configurationsArray: Configuration[] = Object.values(configurations);

  // State for managing configurations
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const adminLoading = isCreating || isUpdating || isDeleting || isActivating;

  // Configuration management handlers
  const handleAddConfiguration = async (configData: Configuration) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await createConfiguration(configData).unwrap();
      setShowAddConfigModal(false);
      setFormSuccess('Configuration added successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to add configuration');
    }
  };

  const handleUpdateConfiguration = async (configData: Configuration) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await updateConfiguration(configData).unwrap();
      setEditingConfig(null);
      setFormSuccess('Configuration updated successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to update configuration');
    }
  };

  const handleDeleteConfiguration = async (configurationId: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await deleteConfiguration(configurationId).unwrap();
      setFormSuccess('Configuration deleted successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to delete configuration');
    }
  };

  const handleActivateConfiguration = async (configurationId: number) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await activateConfiguration(configurationId).unwrap();
      setFormSuccess('Configuration activated successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to activate configuration');
    }
  };

  if (globalLoading) {
    return (
      <Container fluid className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (globalError) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error: {'status' in (globalError as any) ? `Error loading data (${(globalError as any).status})` : 'Failed to load data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Configuration Management
              </h5>
              <Button
                variant="primary"
                onClick={() => setShowAddConfigModal(true)}
                disabled={adminLoading}
              >
                <i className="fas fa-plus me-2"></i>
                Add Configuration
              </Button>
            </Card.Header>
            <Card.Body>
              {formError && (
                <Alert variant="danger" dismissible onClose={() => setFormError(null)}>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formError}
                </Alert>
              )}

              {formSuccess && (
                <Alert variant="success" dismissible onClose={() => setFormSuccess(null)}>
                  <i className="fas fa-check-circle me-2"></i>
                  {formSuccess}
                </Alert>
              )}

              {adminLoading && (
                <div className="text-center mb-3">
                  <Spinner animation="border" size="sm" role="status" /> Updating...
                </div>
              )}

              {configurationsArray.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-cogs fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No configurations found.</p>
                  <p className="text-muted small">
                    Create a configuration to set up default settings for the application.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Organism</th>
                        <th>Assembly</th>
                        <th>Nomenclature</th>
                        <th>Source</th>
                        <th>Version</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configurationsArray.map((config) => (
                        <tr key={config.configuration_id}>
                          <td>
                            {config.active ? (
                              <Badge bg="success">
                                <i className="fas fa-check me-1"></i>
                                Active
                              </Badge>
                            ) : (
                              <Badge bg="secondary">
                                <i className="fas fa-times me-1"></i>
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td>
                            <strong>{config.description}</strong>
                          </td>
                          <td>
                            {organisms[config.organism_id]?.scientific_name || 'Unknown'}
                          </td>
                          <td>
                            {assemblies[config.assembly_id]?.assembly_name || 'Unknown'}
                          </td>
                          <td>
                            {config.nomenclature}
                          </td>
                          <td>
                            {sources[config.source_id]?.name || 'Unknown'}
                          </td>
                          <td>
                            {sources[config.source_id]?.versions?.[config.sv_id]?.version_name || 'Unknown'}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              {!config.active && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleActivateConfiguration(config.configuration_id)}
                                  title="Activate"
                                  disabled={adminLoading}
                                >
                                  <i className="fas fa-check"></i>
                                </Button>
                              )}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setEditingConfig(config)}
                                title="Edit"
                                disabled={adminLoading}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteConfiguration(config.configuration_id)}
                                title="Delete"
                                disabled={adminLoading}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Configuration Form Modals */}
      <ConfigurationFormModal
        show={showAddConfigModal}
        onClose={() => setShowAddConfigModal(false)}
        onSubmit={handleAddConfiguration}
        configuration={null}
        isEditing={false}
        loading={adminLoading}
      />

      <ConfigurationFormModal
        show={!!editingConfig}
        onClose={() => setEditingConfig(null)}
        onSubmit={handleUpdateConfiguration}
        configuration={editingConfig}
        isEditing={true}
        loading={adminLoading}
      />
    </Container>
  );
};

export default ConfigurationsManagement;