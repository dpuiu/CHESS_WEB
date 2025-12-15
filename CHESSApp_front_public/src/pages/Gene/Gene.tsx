import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import TranscriptVisualization from './components/TranscriptVisualization';
import AttributeDisplay from './components/AttributeDisplay';
import SequenceDisplay from './components/SequenceDisplay';
import DatasetDisplay from './components/DatasetDisplay';

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../redux/store';

import { 
  useDbData,
  useAppData,
  useGeneDetails,
  useCmpTranscript,
} from '../../hooks';

import { fetchGeneByGid, clearGeneData } from '../../redux/gene';
import { 
  clearPrimaryTranscriptData,
  clearSecondaryTranscriptData,
 } from '../../redux/gene/cmpTranscriptSlice';
import { fetchTranscriptData } from '../../redux/gene/cmpTranscriptThunks';
import { pathManager } from '../../utils/pathManager';

import { TRANSCRIPT_COLORS } from './constants';

import './Gene.css';
import { GeneCoordinates, Transcript } from '../../types/geneTypes';

const Gene: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { gid } = useParams<{ gid: string }>();
  const [selectedPrimaryTranscript, setSelectedPrimaryTranscript] = useState<Transcript | null>(null);
  const [selectedSecondaryTranscript, setSelectedSecondaryTranscript] = useState<Transcript | null>(null);

  const [hoveredPrimaryAttribute, setHoveredPrimaryAttribute] = useState<string | null>(null);
  const [hoveredSecondaryAttribute, setHoveredSecondaryAttribute] = useState<string | null>(null);

  const dbDataHook = useDbData();
  const appDataHook = useAppData();
  const geneDetailsHook = useGeneDetails();
  const cmpTranscriptHook = useCmpTranscript();

  const appData = appDataHook.getAppData();
  const geneDetails = geneDetailsHook.getGeneDetails();
  const primaryTranscriptDetails = cmpTranscriptHook.getPrimaryTranscriptDetails();
  const secondaryTranscriptDetails = cmpTranscriptHook.getSecondaryTranscriptDetails();

  const isDualTranscriptMode = selectedPrimaryTranscript && selectedSecondaryTranscript;

  // Fetch gene data when component mounts or gid changes
  useEffect(() => {
    if (gid) {
      const numericGid = parseInt(gid, 10);
      if (!isNaN(numericGid)) {
        dispatch(fetchGeneByGid(numericGid));
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      dispatch(clearGeneData());
      dispatch(clearPrimaryTranscriptData());
      dispatch(clearSecondaryTranscriptData());
    };
  }, [gid, dispatch]);

  // Handle transcript selection
  const handlePrimaryTranscriptClick = (transcript: Transcript | null) => {
    if (transcript && appData.selections.assembly_id && appData.selections.nomenclature) {
      dispatch(fetchTranscriptData({
        tid: transcript.tid,
        transcript_id: transcript.transcript_id,
        assembly_id: appData.selections.assembly_id,
        nomenclature: appData.selections.nomenclature
      }));
      setSelectedPrimaryTranscript(transcript);
    }
    else {
      setSelectedPrimaryTranscript(null);
    }
    
  };

  const handleSecondaryTranscriptClick = (transcript: Transcript | null) => {
    if (transcript && appData.selections.assembly_id && appData.selections.nomenclature) {
      dispatch(fetchTranscriptData({
        tid: transcript.tid,
        transcript_id: transcript.transcript_id,
        assembly_id: appData.selections.assembly_id,
        nomenclature: appData.selections.nomenclature,
        isSecondary: true
      }));
      setSelectedSecondaryTranscript(transcript);
    }
    else {
      setSelectedSecondaryTranscript(null);
    }
  };

  const handleViewInBrowser = (geneCoordinates: GeneCoordinates | null) => {
    if (!geneCoordinates) return;
    const sequenceName = geneCoordinates && appData.selections.assembly_id && appData.selections.nomenclature ? dbDataHook.getSequenceNameForAssemblyNomenclature_byID(geneCoordinates.sequence_id, appData.selections.assembly_id, appData.selections.nomenclature) : 'Unknown';
    const geneLocation = `${sequenceName}:${geneCoordinates.start}-${geneCoordinates.end}`;
    const browserPath = pathManager.getBasePath() + "/browser/" + geneLocation;
    navigate(browserPath);
  };

  // Show loading state
  if (geneDetails?.loading) {
    return (
      <LoadingSpinner />
    );
  }

  // Show error state
  if (cmpTranscriptHook.primaryError || cmpTranscriptHook.secondaryError || geneDetails?.error || !geneDetails?.geneData) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error Loading Gene Data</Alert.Heading>
              <p>{cmpTranscriptHook.primaryError || cmpTranscriptHook.secondaryError || geneDetails?.error}</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  const geneCoordinates = geneDetailsHook.getGeneCoordinates();
  const transcriptCount = geneDetailsHook.getTranscriptCount();
  const sequenceName = geneCoordinates && appData.selections.assembly_id && appData.selections.nomenclature ? dbDataHook.getSequenceNameForAssemblyNomenclature_byID(geneCoordinates.sequence_id, appData.selections.assembly_id, appData.selections.nomenclature) : 'Unknown';

  return (
    <Container className="py-5">
      <Row>
        <Col xs={12} md={3} lg={3} className="mb-4 mb-md-0">
          <Sidebar title="">
            <div className="gene-quicklinks">
              <div className="quicklink-item mb-3">
                <a href="#gene-info" className="quicklink-link">
                  <i className="bi bi-info-circle me-2"></i>
                  Gene Information
                </a>
              </div>
              <div className="quicklink-item mb-3">
                <a href="#transcript-viz" className="quicklink-link">
                  <i className="bi bi-graph-up me-2"></i>
                  Transcript Visualization
                </a>
              </div>
              {selectedPrimaryTranscript && (
                <>
                  <div className="quicklink-item mb-3">
                    <a href="#transcript-details" className="quicklink-link">
                      <i className="bi bi-file-text me-2"></i>
                      {isDualTranscriptMode ? 'Transcript Comparison' : 'Transcript Details'}
                    </a>
                  </div>
                  {/* Attributes Section - Only show if attributes exist */}
                  {primaryTranscriptDetails?.attributes && Object.keys(primaryTranscriptDetails.attributes).length > 0 && (
                    <div className="quicklink-item mb-3">
                      <a href="#attributes-display" className="quicklink-link">
                        <i className="bi bi-tags me-2"></i>
                        Attributes
                      </a>
                    </div>
                  )}
                  
                  {/* Sequence Section - Only show if sequence data exists */}
                  {(primaryTranscriptDetails?.nt_sequence || primaryTranscriptDetails?.cds_sequence || primaryTranscriptDetails?.cds_aa_sequence) && (
                    <div className="quicklink-item mb-3">
                      <a href="#sequence-display" className="quicklink-link">
                        <i className="bi bi-code-slash me-2"></i>
                        Sequence
                      </a>
                    </div>
                  )}
                  {/* Available Datasets Section - Only show if datasets exist */}
                  {((primaryTranscriptDetails?.datasets && Array.isArray(primaryTranscriptDetails.datasets) && primaryTranscriptDetails.datasets.length > 0) || 
                    (selectedPrimaryTranscript?.datasets && Array.isArray(selectedPrimaryTranscript.datasets) && selectedPrimaryTranscript.datasets.length > 0)) && (
                    <>
                      <div className="quicklink-item mb-3">
                        <a href="#available-datasets" className="quicklink-link">
                          <i className="bi bi-database me-2"></i>
                          Available Datasets
                        </a>
                      </div>
                      
                      {/* Individual Dataset Quicklinks */}
                      <div className="quicklink-item mb-2">
                        <h6 className="text-muted mb-2 small">Quick Access to Datasets:</h6>
                      </div>
                      {(primaryTranscriptDetails?.datasets || selectedPrimaryTranscript?.datasets || []).map((dataset: any, index: number) => (
                        <div key={index} className="quicklink-item mb-2">
                          <a href={`#primary-dataset-${index}`} className="quicklink-link dataset-link">
                            <i className='bi-database me-2'></i>
                            <span className="small">
                              {dataset?.dataset_name || `Dataset ${index + 1}`}
                            </span>
                          </a>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Transcript Loading Indicator */}
                  {(cmpTranscriptHook.primaryLoading || cmpTranscriptHook.secondaryLoading) && (
                    <div className="quicklink-item mb-2">
                      <div className="text-muted small">
                        <i className="bi bi-hourglass-split me-2"></i>
                        Loading transcript data...
                      </div>
                    </div>
                  )}
                </>
              )}

              <hr className="my-4" />
              
              {/* disable view in browser if geneCoordinates is null */}
              {geneCoordinates && (
                <div className="quicklink-item mb-3">
                  <button 
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => {
                      handleViewInBrowser(geneCoordinates);
                    }}
                  >
                    <i className="bi bi-eye me-2"></i>
                    View in Browser
                  </button>
                </div>
              )}
              {/* Back to Top Button */}
              <div className="quicklink-item mb-3">
                <button 
                  className="btn btn-outline-secondary btn-sm w-100 back-to-top-btn"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="bi bi-arrow-up me-2"></i>
                  Back to Top
                </button>
              </div>
            </div>
          </Sidebar>
        </Col>
        <Col xs={12} md={9} lg={9}>
          <Row>
            <Col>
              <Card className="mb-4" id="gene-info">
                <Card.Body>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <h1 className="mb-3">{geneDetails.geneData?.name}</h1>
                    <code>
                      {sequenceName}:{geneCoordinates ? `${geneCoordinates.start}-${geneCoordinates.end}` : 'Unknown'}
                    </code>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="text-muted">Gene ID: {geneDetails.geneData?.gene_id}</span>
                    <span className="badge bg-secondary">{geneDetails.geneData?.gene_type}</span>
                    <span className="badge bg-info">{transcriptCount} Transcript{transcriptCount > 1 ? 's' : ''}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* Transcript Visualization */}
          <Row id="transcript-viz">
            <Col>
              <Card className="mb-4">
                <Card.Header>
                  <h4 className="mb-0">
                    Transcript models
                  </h4>
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="legend-color" style={{ backgroundColor: TRANSCRIPT_COLORS.primary.main, width: '16px', height: '16px', borderRadius: '3px' }}></div>
                      <span className="text-muted small"><strong>Left click</strong> to select primary transcript</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="legend-color" style={{ backgroundColor: TRANSCRIPT_COLORS.secondary.main, width: '16px', height: '16px', borderRadius: '3px' }}></div>
                      <span className="text-muted small"><strong>Right click</strong> to select secondary transcript for comparison</span>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <TranscriptVisualization
                    key={`transcript-viz-${geneDetails.geneData?.gene_id}`}
                    gene={geneDetails.geneData}
                    onPrimaryTranscriptClick={handlePrimaryTranscriptClick}
                    onSecondaryTranscriptClick={handleSecondaryTranscriptClick}
                    primaryColor={TRANSCRIPT_COLORS.primary.main}
                    secondaryColor={TRANSCRIPT_COLORS.secondary.main}
                    selectedPrimaryTranscript={selectedPrimaryTranscript}
                    selectedSecondaryTranscript={selectedSecondaryTranscript}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* Selected Transcript Information */}
          {selectedPrimaryTranscript && (
            <Row id="transcript-details">
              <Col>
                {/* Attributes Display - Only show if attributes exist */}
                {primaryTranscriptDetails?.attributes && Object.keys(primaryTranscriptDetails.attributes).length > 0 && (
                  <Row id="attributes-display">
                    <h4 className="mb-3 fw-bold text-muted">
                      <i className="bi bi-tags me-2"></i>
                      Attributes
                    </h4>
                    <Col md={isDualTranscriptMode ? 6 : 12}>
                      <Card style={{ backgroundColor: `${TRANSCRIPT_COLORS.primary.lightest}80` }}>
                        <Card.Header className="d-flex flex-wrap align-items-center gap-3">
                          <h5 className="mb-0">{selectedPrimaryTranscript.transcript_id}</h5>
                          <span className="badge bg-secondary">{selectedPrimaryTranscript.transcript_type}</span>
                        </Card.Header>
                        <Card.Body>
                          {/* Attributes */}
                          {primaryTranscriptDetails && !cmpTranscriptHook.primaryLoading && !cmpTranscriptHook.primaryError && (
                            <AttributeDisplay 
                                transcriptData={primaryTranscriptDetails}
                                onAttributeHover={setHoveredPrimaryAttribute}
                                hoveredAttribute={hoveredSecondaryAttribute}
                                layout={isDualTranscriptMode ? 'multicolumn' : 'single'}
                            />
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    {isDualTranscriptMode && (
                      <Col md={6}>
                        <Card style={{ backgroundColor: `${TRANSCRIPT_COLORS.secondary.lightest}80` }}>
                          <Card.Header className="d-flex flex-wrap align-items-center gap-3">
                            <h5 className="mb-0">{selectedSecondaryTranscript.transcript_id}</h5>
                            <span className="badge bg-secondary">{selectedPrimaryTranscript.transcript_type}</span>
                          </Card.Header>
                          <Card.Body>
                            {secondaryTranscriptDetails && !cmpTranscriptHook.secondaryLoading && !cmpTranscriptHook.secondaryError && (
                              <AttributeDisplay 
                                  transcriptData={secondaryTranscriptDetails}
                                  onAttributeHover={setHoveredSecondaryAttribute}
                                  hoveredAttribute={hoveredPrimaryAttribute}
                                  layout={isDualTranscriptMode ? 'multicolumn' : 'single'}
                              />
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    )}
                  </Row>
                )}
                
                {/* Sequence Display - Only show if sequence data exists */}
                {(primaryTranscriptDetails?.nt_sequence || primaryTranscriptDetails?.cds_sequence || primaryTranscriptDetails?.cds_aa_sequence) && (
                  <Row id="sequence-display">
                    <h4 className="mb-3 fw-bold text-muted">
                      <i className="bi bi-code-slash me-2"></i>
                      Sequence
                    </h4>
                    <Col md={isDualTranscriptMode ? 6 : 12}>
                      <Card style={{ backgroundColor: `${TRANSCRIPT_COLORS.primary.lightest}80` }}>
                        <Card.Body>
                          {primaryTranscriptDetails && !cmpTranscriptHook.primaryLoading && !cmpTranscriptHook.primaryError && (
                            <SequenceDisplay transcriptData={primaryTranscriptDetails} />
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    {isDualTranscriptMode && (
                      <Col md={6}>
                        <Card style={{ backgroundColor: `${TRANSCRIPT_COLORS.secondary.lightest}80` }}>
                          <Card.Body>
                            {secondaryTranscriptDetails && !cmpTranscriptHook.secondaryLoading && !cmpTranscriptHook.secondaryError && (
                              <SequenceDisplay transcriptData={secondaryTranscriptDetails} />
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    )}
                  </Row>
                )}

                {/* Dataset Display - Only show if datasets exist */}
                {((primaryTranscriptDetails?.datasets && Array.isArray(primaryTranscriptDetails.datasets) && primaryTranscriptDetails.datasets.length > 0) || 
                  (selectedPrimaryTranscript?.datasets && Array.isArray(selectedPrimaryTranscript.datasets) && selectedPrimaryTranscript.datasets.length > 0)) && (
                  <Row id="available-datasets">
                    <h4 className="mb-3 fw-bold text-muted">
                      <i className="bi bi-database me-2"></i>
                      Available Datasets
                    </h4>
                    <DatasetDisplay 
                      primaryTranscriptDetails={primaryTranscriptDetails} 
                      secondaryTranscriptDetails={secondaryTranscriptDetails} 
                      isSecondaryModeEnabled={!!selectedSecondaryTranscript}
                    />
                  </Row>
                )}
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Gene;