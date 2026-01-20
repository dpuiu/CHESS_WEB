import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Card, Table, Badge, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useAddSourceVersionMutation,
  useDeleteSourceVersionMutation,
  useReorderSourceVersionsMutation
} from '../redux/api/apiSlice';
import SourceVersionFormModal from '../components/sourceManager/SourceVersionFormModal';
import { Source, SourceVersion } from '../types';

const SourceDetail: React.FC = () => {
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();

  // RTK Query Hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [addSourceVersion, { isLoading: isAdding }] = useAddSourceVersionMutation();
  const [deleteSourceVersion, { isLoading: isDeleting }] = useDeleteSourceVersionMutation();
  const [reorderSourceVersions, { isLoading: isReordering }] = useReorderSourceVersionsMutation();

  const sources = globalData?.sources || {};
  const loading = globalLoading;

  const source: Source | undefined = sourceId ? sources?.[parseInt(sourceId)] : undefined;

  // Helper function to get source versions for this source
  const getSourceVersions = () => {
    if (!source?.versions) return [];

    return Object.values(source.versions).filter(version =>
      version &&
      typeof version === 'object' &&
      version.sv_id &&
      version.version_name
    ).sort((a, b) => a.version_rank - b.version_rank); // Sort by rank
  };

  const [showAddVersionModal, setShowAddVersionModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [localVersions, setLocalVersions] = useState<SourceVersion[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedVersion, setDraggedVersion] = useState<SourceVersion | null>(null);

  useEffect(() => {
    const versions = getSourceVersions();
    setLocalVersions(versions);
    setHasUnsavedChanges(false);
  }, [source]);

  const handleAddSourceVersion = async (svData: SourceVersion) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await addSourceVersion({ source_id: parseInt(sourceId!), svData }).unwrap();
      setShowAddVersionModal(false);
      setFormSuccess('Source version added successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to add source version');
    }
  };

  const handleDeleteSourceVersion = async (svId: number) => {
    if (!window.confirm('Are you sure you want to delete this source version?')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await deleteSourceVersion({ source_id: parseInt(sourceId!), sv_id: svId }).unwrap();
      setFormSuccess('Source version deleted successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to delete source version');
    }
  };

  const handleDragStart = (e: React.DragEvent, version: SourceVersion) => {
    setDraggedVersion(version);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', version.sv_id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetVersion: SourceVersion) => {
    e.preventDefault();

    if (!draggedVersion || draggedVersion.sv_id === targetVersion.sv_id) {
      setDraggedVersion(null);
      return;
    }

    const draggedIndex = localVersions.findIndex(v => v.sv_id === draggedVersion.sv_id);
    const targetIndex = localVersions.findIndex(v => v.sv_id === targetVersion.sv_id);

    const newVersions = [...localVersions];
    const [draggedItem] = newVersions.splice(draggedIndex, 1);
    newVersions.splice(targetIndex, 0, draggedItem);

    const updatedVersions = newVersions.map((version, index) => ({
      ...version,
      version_rank: index
    }));

    setLocalVersions(updatedVersions);
    setHasUnsavedChanges(true);
    setDraggedVersion(null);
  };

  const handleSaveOrder = async () => {
    try {
      setFormError(null);
      setFormSuccess(null);

      const newOrder = localVersions.map(version => version.sv_id);

      await reorderSourceVersions({
        source_id: parseInt(sourceId!),
        new_order: newOrder
      }).unwrap();
      setHasUnsavedChanges(false);
      setFormSuccess('Version order updated successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to update version order');
    }
  };

  const handleResetOrder = () => {
    const originalVersions = getSourceVersions();
    setLocalVersions(originalVersions);
    setHasUnsavedChanges(false);
  };

  const handleVersionClick = (version: SourceVersion) => {
    navigate(`/sources/${sourceId}/sv/${version.sv_id}`);
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

  if (!source) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="warning">
          Source not found. <Button variant="link" onClick={() => navigate('/sources')}>Back to Sources</Button>
        </Alert>
      </Container>
    );
  }

  const sourceVersions = getSourceVersions();
  const actionLoading = isAdding || isDeleting || isReordering;

  return (
    <Container fluid>
      <style>
        {`
          .table tbody tr {
            transition: all 0.2s ease;
          }
          .table tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.1) !important;
          }
          .table tbody tr.table-active {
            background-color: rgba(0, 123, 255, 0.2) !important;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .table tbody tr[draggable="true"]:active {
            cursor: grabbing !important;
          }
          .drag-handle {
            cursor: grab;
            color: #6c757d;
            transition: color 0.2s ease;
          }
          .drag-handle:hover {
            color: #495057;
          }
          .unsaved-changes {
            background-color: rgba(255, 193, 7, 0.1) !important;
          }
        `}
      </style>
      <Row>
        <Col>
          <Button
            variant="secondary"
            onClick={() => navigate('/sources')}
            className="mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Source List
          </Button>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Source: {source.name}</h2>
              <p className="text-muted mb-0">
                {source.information || 'No description available'}
              </p>
              {source.link && (
                <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                  <i className="fas fa-external-link-alt me-1"></i>
                  Visit Source Website
                </a>
              )}
            </div>
            <div className="text-end">
              <Badge bg="info" className="fs-6 mb-2">
                Source ID: {source.source_id}
              </Badge>
              <div className="d-block">
                <Badge bg={sourceVersions.length > 0 ? 'success' : 'warning'}>
                  {sourceVersions.length} version{sourceVersions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
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
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-grip-vertical me-2"></i>
                  Source Versions
                  <small className="text-muted ms-2">(Drag to reorder)</small>
                </h5>
                {hasUnsavedChanges && (
                  <small className="text-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    You have unsaved changes
                  </small>
                )}
                {hasUnsavedChanges && (
                  <div className="btn-group">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleResetOrder}
                      title="Reset Order"
                      disabled={actionLoading}
                    >
                      <i className="fas fa-undo me-1"></i>Reset
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleSaveOrder}
                      title="Save Order"
                      disabled={actionLoading}
                    >
                      <i className="fas fa-save me-1"></i>Save Order
                    </Button>
                  </div>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddVersionModal(true)}
                  disabled={actionLoading}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Version
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {sourceVersions.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-code-branch fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No versions found for this source.</p>
                  <p className="text-muted small">Add your first version using the button above.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}></th>
                        <th>Version Name</th>
                        <th>Rank</th>
                        <th>Assemblies</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localVersions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No versions found for this source.
                          </td>
                        </tr>
                      ) : (
                        localVersions.map(version => (
                          <tr
                            key={version.sv_id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, version)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, version)}
                            className={`${draggedVersion?.sv_id === version.sv_id ? 'table-active' : ''} ${hasUnsavedChanges ? 'unsaved-changes' : ''}`}
                          >
                            <td>
                              <i className="fas fa-grip-vertical drag-handle"></i>
                            </td>
                            <td><strong>{version.version_name}</strong></td>
                            <td><Badge bg="info">{version.version_rank}</Badge></td>
                            <td>
                              <Badge
                                bg={version.assemblies && Object.keys(version.assemblies).length > 0 ? 'success' : 'secondary'}
                                className="me-1"
                              >
                                <i className="fas fa-database me-1"></i>
                                {version.assemblies ? Object.keys(version.assemblies).length : 0}
                              </Badge>
                              {version.assemblies && Object.keys(version.assemblies).length > 0 && (
                                <small className="text-muted">
                                  assembl{Object.keys(version.assemblies).length === 1 ? 'y' : 'ies'}
                                </small>
                              )}
                            </td>
                            <td>{version.last_updated ? (
                              <small className="text-muted">{new Date(version.last_updated).toLocaleDateString()}</small>
                            ) : (
                              <span className="text-muted">Unknown</span>
                            )}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleVersionClick(version)}
                                  title="Add Files"
                                >
                                  <i className="fas fa-cog"></i> Add GTF/GFF files
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteSourceVersion(version.sv_id)}
                                  title="Delete Version"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Source Version Form Modal */}
      <SourceVersionFormModal
        show={showAddVersionModal}
        onClose={() => setShowAddVersionModal(false)}
        onSubmit={handleAddSourceVersion}
      />
    </Container>
  );
};

export default SourceDetail;