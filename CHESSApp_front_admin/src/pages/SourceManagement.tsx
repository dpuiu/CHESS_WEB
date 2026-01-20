import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Card, Table, Badge, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useAddSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation
} from '../redux/api/apiSlice';
import SourceFormModal from '../components/sourceManager/SourceFormModal';
import { Source } from '../types';

const SourceManagement: React.FC = () => {
  const navigate = useNavigate();

  // RTK Query Hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [addSource, { isLoading: isAdding }] = useAddSourceMutation();
  const [updateSource, { isLoading: isUpdating }] = useUpdateSourceMutation();
  const [deleteSource, { isLoading: isDeleting }] = useDeleteSourceMutation();

  const sources = globalData?.sources || {};

  // Convert data to arrays for easier use
  const sourcesArray: Source[] = Object.values(sources);

  const loading = globalLoading;
  const actionLoading = isAdding || isUpdating || isDeleting;

  // State for managing sources
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Source management handlers
  const handleAddSource = async (sourceData: Source) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await addSource(sourceData).unwrap();
      setShowAddSourceModal(false);
      setFormSuccess('Source added successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to add source');
    }
  };

  const handleUpdateSource = async (sourceData: Source) => {
    if (!editingSource) return;

    try {
      setFormError(null);
      setFormSuccess(null);

      await updateSource({
        source_id: editingSource.source_id,
        sourceData
      }).unwrap();
      setEditingSource(null);
      setFormSuccess('Source updated successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to update source');
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    if (!window.confirm('Are you sure you want to delete this source? This will also delete all its versions.')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await deleteSource(sourceId).unwrap();
      setFormSuccess('Source deleted successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to delete source');
    }
  };

  const handleSourceClick = (source: Source) => {
    navigate(`/sources/${source.source_id}`);
  };

  const handleCloseModal = () => {
    setShowAddSourceModal(false);
    setEditingSource(null);
  };

  if (loading) {
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
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Source Management</h2>
              <p className="text-muted mb-0">Manage genomic data sources and their versions</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddSourceModal(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-plus me-2"></i>
              Add Source
            </Button>
          </div>
        </Col>
      </Row>

      {formError && (
        <Alert variant="danger" dismissible onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert variant="success" dismissible onClose={() => setFormSuccess(null)}>
          {formSuccess}
        </Alert>
      )}

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-database me-2"></i>
                Genomic Data Sources
                {sourcesArray.length > 0 && (
                  <Badge bg="info" className="ms-2">
                    {sourcesArray.length} source{sourcesArray.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {actionLoading && (
                <div className="text-center mb-3">
                  <Spinner animation="border" size="sm" role="status" /> Updating...
                </div>
              )}
              {sourcesArray.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-database fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No sources found.</p>
                  <p className="text-muted small">Add your first source using the button above.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Source Name</th>
                        <th>Description</th>
                        <th>Link</th>
                        <th>Versions</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourcesArray.map(source => (
                        <tr
                          key={source.source_id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSourceClick(source)}
                        >
                          <td>
                            <strong>{source.name}</strong>
                          </td>
                          <td>
                            {source.information ? (
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={source.information}>
                                {source.information}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {source.link ? (
                              <a href={source.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <i className="fas fa-external-link-alt me-1"></i>
                                Link
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {(() => {
                              const validVersions = Object.values(source.versions || {}).filter(version =>
                                version !== null && version !== undefined && typeof version === 'object' && version.sv_id
                              );
                              const versionCount = validVersions.length;

                              return (
                                <>
                                  <Badge
                                    bg={versionCount > 0 ? 'success' : 'secondary'}
                                    className="me-1"
                                  >
                                    <i className="fas fa-code-branch me-1"></i>
                                    {versionCount}
                                  </Badge>
                                  {versionCount > 0 && (
                                    <small className="text-muted">
                                      version{versionCount === 1 ? '' : 's'}
                                    </small>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          <td>
                            {source.last_updated ? (
                              <small className="text-muted">
                                {new Date(source.last_updated).toLocaleDateString()}
                              </small>
                            ) : (
                              <span className="text-muted">Unknown</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingSource(source);
                                }}
                                title="Edit Source"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteSource(source.source_id);
                                }}
                                title="Delete Source"
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

      <SourceFormModal
        show={showAddSourceModal || !!editingSource}
        onClose={handleCloseModal}
        onSubmit={editingSource ? handleUpdateSource : handleAddSource}
        source={editingSource}
        isEditing={!!editingSource}
      />
    </Container>
  );
};

export default SourceManagement;