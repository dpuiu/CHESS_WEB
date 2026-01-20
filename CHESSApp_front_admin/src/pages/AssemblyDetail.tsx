import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Card, Table, Badge, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useUploadFastaFileMutation,
  useUploadNomenclatureTsvMutation,
  useRemoveNomenclatureFromAssemblyMutation
} from '../redux/api/apiSlice';
import FastaUploadModal from '../components/assemblyManager/FastaUploadModal';
import NomenclatureUploadModal from '../components/assemblyManager/NomenclatureUploadModal';
import { Assembly, Organism } from '../types';

const AssemblyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { assemblyId } = useParams<{ assemblyId: string }>();

  // RTK Query hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [uploadFastaFile] = useUploadFastaFileMutation();
  const [uploadNomenclatureTsv] = useUploadNomenclatureTsvMutation();
  const [removeNomenclatureFromAssembly] = useRemoveNomenclatureFromAssemblyMutation();

  const organisms = globalData?.organisms;
  const assemblies = globalData?.assemblies;

  const organismsArray: Organism[] = organisms ? Object.values(organisms) : [];
  const currentAssembly = assemblies?.[Number(assemblyId)] as Assembly | undefined;

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showNomenclatureModal, setShowNomenclatureModal] = useState(false);

  const handleUploadFasta = async (uploadData: {
    file: File;
    file_type: string;
    assembly_id: number;
    nomenclature: string;
    onProgress?: (progress: number) => void;
  }) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await uploadFastaFile({
        assembly_id: uploadData.assembly_id,
        fasta_file: uploadData.file,
        nomenclature: uploadData.nomenclature,
        onProgress: uploadData.onProgress
      }).unwrap();
      setFormSuccess('FASTA file uploaded successfully!');
      setShowUploadForm(false);
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to upload FASTA file');
    }
  };

  const handleRemoveNomenclature = async (nomenclature: string) => {
    if (!currentAssembly) return;

    if (!window.confirm(`Are you sure you want to remove nomenclature "${nomenclature}"? This cannot be undone.`)) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await removeNomenclatureFromAssembly({
        assembly_id: currentAssembly.assembly_id,
        nomenclature
      }).unwrap();
      setFormSuccess('Nomenclature removed successfully!');
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to remove nomenclature');
    }
  };

  const handleUploadNomenclatureTsv = async (uploadData: {
    tsv_file: File;
    source_nomenclature: string;
    new_nomenclature: string;
  }) => {
    if (!currentAssembly) return;

    try {
      setFormError(null);
      setFormSuccess(null);

      await uploadNomenclatureTsv({
        assembly_id: currentAssembly.assembly_id,
        tsv_file: uploadData.tsv_file,
        source_nomenclature: uploadData.source_nomenclature,
        new_nomenclature: uploadData.new_nomenclature
      }).unwrap();
      setFormSuccess('Nomenclature created successfully!');
      setShowNomenclatureModal(false);
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to create nomenclature');
    }
  };

  const getOrganismName = (taxonomyId: number) => {
    const organism = organismsArray.find(org => org.taxonomy_id === taxonomyId);
    return organism ? `${organism.scientific_name} (${organism.common_name})` : `Taxonomy ID: ${taxonomyId}`;
  };

  const getFastaStatus = () => {
    if (!currentAssembly?.genome_files) return { hasFasta: false, count: 0 };
    return { hasFasta: currentAssembly.genome_files.length > 0, count: currentAssembly.genome_files.length };
  };

  const getFileNameFromPath = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
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

  if (!currentAssembly) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="warning">
          Assembly not found. <Button variant="link" onClick={() => navigate('/assemblies')}>Back to Assemblies</Button>
        </Alert>
      </Container>
    );
  }

  const fastaStatus = getFastaStatus();

  return (
    <Container fluid>
      <Row>
        <Col>
          <Button
            variant="secondary"
            onClick={() => navigate('/assemblies')}
            className="mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Assembly List
          </Button>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Assembly: {currentAssembly.assembly_name}</h2>
              <p className="text-muted mb-0">
                {getOrganismName(currentAssembly.taxonomy_id)}
              </p>
              <p className="text-muted mb-0">
                {currentAssembly.information}
              </p>
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
        <Col xs={12} className="mb-4">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-tags me-2"></i>
                  Nomenclatures & FASTA Files
                </h5>
                {fastaStatus.hasFasta ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowNomenclatureModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Nomenclature
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowUploadForm(true)}
                  >
                    <i className="fas fa-upload me-2"></i>
                    Upload FASTA File
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {currentAssembly?.nomenclatures && currentAssembly.nomenclatures.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Nomenclature</th>
                        <th>FASTA Files</th>
                        <th>File Paths</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAssembly.nomenclatures.map(nomenclature => {
                        const nomenclatureFiles = currentAssembly.genome_files?.filter(file => file.nomenclature === nomenclature) || [];
                        return (
                          <tr key={nomenclature}>
                            <td>
                              <Badge bg="info" className="fs-6">{nomenclature}</Badge>
                            </td>
                            <td>
                              {nomenclatureFiles.length > 0 ? (
                                <Badge bg="success">
                                  {nomenclatureFiles.length} file{nomenclatureFiles.length !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <Badge bg="warning">No files</Badge>
                              )}
                            </td>
                            <td>
                              {nomenclatureFiles.length > 0 ? (
                                <div>
                                  {nomenclatureFiles.map(file => (
                                    <div key={file.genome_file_id} className="mb-1">
                                      <code className="small">{getFileNameFromPath(file.file_path)}</code>
                                      <br />
                                      <small className="text-muted">
                                        <i className="fas fa-folder me-1"></i>
                                        globaldata/assemblies/genome_files/
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted small">No FASTA files uploaded</span>
                              )}
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveNomenclature(nomenclature)}
                                title="Remove nomenclature"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-tags fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No nomenclatures found for this assembly.</p>
                  <p className="text-muted small">
                    {fastaStatus.hasFasta
                      ? "Add a new nomenclature using the button above."
                      : "Upload a FASTA file to create the first nomenclature for this assembly."
                    }
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-list-ol me-2"></i>
                Sequence ID Mappings (Cross-Nomenclature)
              </h5>
            </Card.Header>
            <Card.Body>
              {currentAssembly?.sequence_id_mappings && Object.keys(currentAssembly.sequence_id_mappings).length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Sequence ID</th>
                        <th>Length</th>
                        <th>Nomenclatures</th>
                        <th>Sequence Names</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(currentAssembly.sequence_id_mappings).map(([sequence_id, data]) => (
                        <tr key={sequence_id}>
                          <td>
                            <code>{sequence_id}</code>
                          </td>
                          <td>{data.length?.toLocaleString() || '0'} bp</td>
                          <td>
                            {Object.keys(data.nomenclatures || {}).map(nom => (
                              <Badge key={nom} bg="info" className="me-1">{nom}</Badge>
                            ))}
                          </td>
                          <td>
                            {Object.entries(data.nomenclatures || {}).map(([nom, seqName]) => (
                              <div key={nom} className="small">
                                <strong>{nom}:</strong> {seqName}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-list-ol fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No sequence ID mappings found for this assembly.</p>
                  <p className="text-muted small">
                    Upload a FASTA file to see sequence ID mappings across nomenclatures.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FastaUploadModal
        assembly={currentAssembly}
        show={showUploadForm}
        onSubmit={handleUploadFasta}
        onCancel={() => setShowUploadForm(false)}
        onError={setFormError}
        onSuccess={() => setFormSuccess('FASTA file uploaded successfully!')}
      />

      <NomenclatureUploadModal
        assemblyId={currentAssembly.assembly_id}
        show={showNomenclatureModal}
        onSubmit={handleUploadNomenclatureTsv}
        onCancel={() => setShowNomenclatureModal(false)}
      />
    </Container>
  );
};

export default AssemblyDetail;