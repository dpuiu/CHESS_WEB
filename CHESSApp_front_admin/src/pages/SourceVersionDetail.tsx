import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Card, Table, Badge, Spinner, Modal } from 'react-bootstrap';
import { RootState, AppDispatch } from '../redux/store';
import { 
  uploadSourceVersionFile,
  confirmAnnotationUpload,
  removeSourceVersionAssembly
} from '../redux/adminData/adminDataThunks';
import SourceVersionFileUploadForm from '../components/sourceManager/SourceVersionFileUploadForm';
import SourceVersionFileUploadConfirmationModal from '../components/sourceManager/SourceVersionFileUploadConfirmationModal';
import { SourceVersionAssembly, Assembly } from '../types/db_types';
import { NomenclatureDetectionResult, AttributeMapping } from '../types/file';
import { clearGlobalData } from '../redux/globalData/globalDataSlice';

const SourceVersionDetail: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sourceId, svId } = useParams<{ sourceId: string; svId: string }>();
  const { sources, assemblies, organisms, loading, error } = useSelector((state: RootState) => state.globalData);

  // Convert to arrays
  const assembliesArray = useMemo(() => assemblies ? Object.values(assemblies) : [], [assemblies]);
  const organismsArray = useMemo(() => organisms ? Object.values(organisms) : [], [organisms]);

  // Get source and version
  const source = useMemo(() => sourceId ? sources?.[parseInt(sourceId)] : undefined, [sources, sourceId]);
  const sourceVersion = useMemo(() => svId && source?.versions ? source.versions[parseInt(svId)] : undefined, [source, svId]);

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedAssemblyForUpload, setSelectedAssemblyForUpload] = useState<Assembly | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [detectionResult, setDetectionResult] = useState<NomenclatureDetectionResult | null>(null);

  // Extract assemblies from source version
  const svAssemblies = useMemo<SourceVersionAssembly[]>(() => {
    if (!sourceVersion?.assemblies) return [];
    return Object.values(sourceVersion.assemblies).map((a: any) => ({
      sva_id: a.sva_id,
      assembly_id: a.assembly_id,
      files: a.files || {}
    }));
  }, [sourceVersion]);

  // Assemblies without files yet
  const availableAssemblies = useMemo(() => {
    const usedIds = new Set(svAssemblies.map(a => a.assembly_id));
    return assembliesArray.filter(a => !usedIds.has(a.assembly_id));
  }, [svAssemblies, assembliesArray]);

  // Helper to get assembly name
  const getAssemblyName = (assemblyId: number) => 
    assemblies?.[assemblyId]?.assembly_name || `Assembly ${assemblyId}`;

  // Helper to get organism name
  const getOrganismName = (taxonomyId: number) =>
    organismsArray.find(o => o.taxonomy_id === taxonomyId)?.scientific_name || 'Unknown';

  // Handlers
  const closeUploadModal = () => {
    setShowUploadForm(false);
    setSelectedAssemblyForUpload(null);
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setDetectionResult(null);
  };

  const handleUploadFile = async (
    file: File, svId: number, assemblyId: number, fileType: 'gtf' | 'gff',
    description: string, onProgress?: (progress: number) => void
  ) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      const result = await dispatch(uploadSourceVersionFile({
        source_id: parseInt(sourceId!), file, sv_id: svId, assembly_id: assemblyId,
        file_type: fileType, description, onProgress
      })).unwrap();

      if (result && typeof result === 'object' && 'status' in result && result.status === 'nomenclature_detection') {
        const detectionData = result as any;
        setDetectionResult({
          detected_nomenclatures: detectionData.detected_nomenclatures || [],
          attributes: detectionData.attributes || {},
          file_sequences: detectionData.file_sequences || [],
          temp_file_path: detectionData.temp_file_path || '',
          norm_gtf_path: detectionData.norm_gtf_path || '',
          assembly_id: detectionData.assembly_id || 0,
          source_version_id: detectionData.source_version_id || 0,
          description: detectionData.description || ''
        });
        console.log(detectionData);
        closeUploadModal();
        setShowConfirmationModal(true);
      } else {
        closeUploadModal();
        setFormSuccess('File uploaded successfully!');
        dispatch(clearGlobalData());
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload file');
    }
  };

  const handleConfirmUpload = async (selectedNomenclature: string, attributeMapping: AttributeMapping) => {
    if (!detectionResult) return;

    try {
      setFormError(null);
      await dispatch(confirmAnnotationUpload({
        source_id: parseInt(sourceId!),
        sv_id: parseInt(svId!),
        confirmationData: {
          selected_nomenclature: selectedNomenclature,
          ...attributeMapping,
          temp_file_path: detectionResult.temp_file_path,
          norm_gtf_path: detectionResult.norm_gtf_path,
          assembly_id: detectionResult.assembly_id,
          source_version_id: detectionResult.source_version_id,
          description: detectionResult.description
        }
      })).unwrap();

      closeConfirmationModal();
      setFormSuccess('File uploaded successfully!');
      dispatch(clearGlobalData());
    } catch (err: any) {
      setFormError(err.message || 'Failed to confirm upload');
      closeConfirmationModal();
    }
  };

  const handleRemoveAssembly = async (svaId: number) => {
    if (!window.confirm('Remove this assembly and all its files? This cannot be undone.')) return;

    try {
      setFormError(null);
      await dispatch(removeSourceVersionAssembly({
        source_id: parseInt(sourceId!),
        sv_id: parseInt(svId!),
        sva_id: svaId
      })).unwrap();
      setFormSuccess('Assembly removed successfully!');
      dispatch(clearGlobalData());
    } catch (err: any) {
      setFormError(err.message || 'Failed to remove assembly');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="danger">Error: {error}</Alert>
      </Container>
    );
  }

  // Not found state
  if (!source || !sourceVersion) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="warning">
          Source or Source Version not found.
          <Button variant="link" onClick={() => navigate('/sources')}>Back to Sources</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button variant="secondary" onClick={() => navigate(`/sources/${sourceId}`)} className="mb-3">
            <i className="fas fa-arrow-left me-2" />Back to Source
          </Button>
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-1">Source Version: {sourceVersion.version_name}</h2>
              <p className="text-muted mb-0">Source: {source.name} | Rank: {sourceVersion.version_rank}</p>
            </Col>
            <Col xs="auto">
              <Badge bg="info" className="fs-6">Version ID: {sourceVersion.sv_id}</Badge>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Alerts */}
      {formError && <Alert variant="danger" dismissible onClose={() => setFormError(null)}>{formError}</Alert>}
      {formSuccess && <Alert variant="success" dismissible onClose={() => setFormSuccess(null)}>{formSuccess}</Alert>}

      {/* Available Assemblies for Upload */}
      {availableAssemblies.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="fas fa-upload me-2" />
              Available Assemblies for Upload
              <Badge bg="success" className="ms-2">{availableAssemblies.length}</Badge>
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {availableAssemblies.map(assembly => (
                <Col key={assembly.assembly_id} md={6} lg={4} className="mb-3">
                  <Card border="success" className="h-100">
                    <Card.Body>
                      <Card.Title as="h6">
                        <i className="fas fa-database me-2" />{assembly.assembly_name}
                      </Card.Title>
                      <Card.Text className="small">
                        <strong>Organism:</strong> {getOrganismName(assembly.taxonomy_id)}
                      </Card.Text>
                    </Card.Body>
                    <Card.Footer className="bg-transparent">
                      <Button
                        variant="success"
                        size="sm"
                        className="w-100"
                        onClick={() => { setSelectedAssemblyForUpload(assembly); setShowUploadForm(true); }}
                      >
                        <i className="fas fa-upload me-2" />Upload GTF/GFF
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Uploaded Files by Assembly */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-file-alt me-2" />
            Uploaded Files by Assembly
            <Badge bg="info" className="ms-2">{svAssemblies.length}</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          {svAssemblies.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="fas fa-file-alt fa-3x mb-3" />
              <p>No files uploaded for this source version.</p>
              <p className="small">Upload GTF/GFF files for available assemblies to get started.</p>
            </div>
          ) : (
            svAssemblies.map((sva, idx) => {
              const files = Object.values(sva.files || {});
              return (
                <Card key={sva.sva_id} className={idx < svAssemblies.length - 1 ? 'mb-4' : ''}>
                  <Card.Header className="bg-light">
                    <Row className="align-items-center">
                      <Col>
                        <h6 className="mb-0">
                          <i className="fas fa-database me-2" />
                          {getAssemblyName(sva.assembly_id)}
                          <Badge bg="secondary" className="ms-2">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
                        </h6>
                      </Col>
                      <Col xs="auto">
                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveAssembly(sva.sva_id)}>
                          <i className="fas fa-trash me-2" />Remove
                        </Button>
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body>
                    {files.length > 0 ? (
                      <Table striped hover size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Nomenclature</th>
                            <th>Type</th>
                            <th>Path</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map((file: any, i) => (
                            <tr key={file.file_key || i}>
                              <td><Badge bg="secondary">{file.nomenclature || 'Unknown'}</Badge></td>
                              <td><Badge bg="primary">{file.filetype || 'Unknown'}</Badge></td>
                              <td><code className="small">{file.file_path}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted mb-0">
                        <i className="fas fa-exclamation-triangle text-warning me-2" />
                        No files uploaded for this assembly
                      </p>
                    )}
                  </Card.Body>
                </Card>
              );
            })
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadForm && !!selectedAssemblyForUpload} onHide={closeUploadModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-upload me-2" />Upload GTF/GFF
            {selectedAssemblyForUpload && (
              <Badge bg="primary" className="ms-2">{selectedAssemblyForUpload.assembly_name}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssemblyForUpload && (
            <SourceVersionFileUploadForm
              sourceVersion={sourceVersion}
              organisms={organismsArray}
              assemblies={assembliesArray}
              selectedAssembly={selectedAssemblyForUpload}
              onSubmit={handleUploadFile}
              onCancel={closeUploadModal}
              onError={setFormError}
              onSuccess={() => setFormSuccess('File uploaded successfully!')}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Confirmation Modal */}
      {detectionResult && (
        <SourceVersionFileUploadConfirmationModal
          isOpen={showConfirmationModal}
          detectedNomenclatures={detectionResult.detected_nomenclatures}
          attributes={detectionResult.attributes}
          fileSequences={detectionResult.file_sequences}
          onConfirm={handleConfirmUpload}
          onCancel={() => { closeConfirmationModal(); closeUploadModal(); }}
          onError={setFormError}
        />
      )}
    </Container>
  );
};

export default SourceVersionDetail; 