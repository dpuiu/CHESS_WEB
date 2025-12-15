import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Badge, Alert, Table, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Organism, Assembly, Source, SourceVersion } from '../../../types/dbTypes';
import { useDbData } from '../../../hooks';
import SelectionCard from './SelectionCard';

import { usePathManager } from '../../../hooks/usePathManager';

type SelectionStep = 'organism' | 'assembly' | 'nomenclature' | 'source' | 'version';
interface TempSelections {
  organism?: Organism;
  assembly?: Assembly;
  nomenclature?: string;
  source?: Source;
  version?: SourceVersion;
}

interface AppSettingsModalProps {
  show: boolean;
  canClose?: boolean;
  onClose?: () => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ show, canClose = true, onClose }) => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<SelectionStep>('organism');
  const [tempSelections, setTempSelections] = useState<TempSelections>({});

  const {
    extractRouteFromPath
  } = usePathManager();

  const steps: SelectionStep[] = ['organism', 'assembly', 'nomenclature', 'source', 'version'];

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('organism');
    setTempSelections({});
  };

  const handleClose = () => {
    if (canClose) {
      resetModal();
      if (onClose) {
        onClose();
      }
    }
  };

  useEffect(() => {
    resetModal();
  }, []);

  // Close modal when URL changes (after successful navigation)
  useEffect(() => {
    if (show && !canClose) {
      if (onClose) {
        onClose();
      }
    }
  }, [show, canClose, onClose]);

  const dbDataHook = useDbData();
  const { 
    getAllOrganisms, 
    getAllAssembliesForOrganism_byID, 
    getAllSourcesForAssembly, 
    getAllVersionsForSourceAssembly, 
    getSequenceNamesForAssemblyNomenclature 
  } = dbDataHook;

  // Selection handlers
  const handleSelection = (step: SelectionStep, value: any) => {
    const newSelections = { ...tempSelections, [step]: value };
    
    setTempSelections(newSelections);
    
    // Auto-advance to next step
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // Navigation
  const canProceed = () => !!tempSelections[currentStep as keyof TempSelections];
  
  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      // Clear selections from current step onwards
      const newSelections = { ...tempSelections };
      steps.slice(currentIndex).forEach(step => {
        delete newSelections[step as keyof TempSelections];
      });
      setTempSelections(newSelections);
    }
  };

  const handleConfirmSelection = () => {
    const { organism, assembly, source, version, nomenclature } = tempSelections;
    let currentRoute = extractRouteFromPath(location.pathname);
    if (currentRoute === 'gene' || currentRoute === 'explore') {
      currentRoute = '';
    }
    if (organism && assembly && source && version && nomenclature) {
      const newUrl = `/o:${organism.taxonomy_id}/a:${assembly.assembly_id}/s:${source.source_id}/v:${version.sv_id}/n:${nomenclature}/${currentRoute}`;
      navigate(newUrl, { replace: true });
      handleClose();
    }
  };

  // Breadcrumb
  const renderBreadcrumb = () => (
    <div className="mb-4">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <Badge 
              bg={currentStep === step ? 'primary' : (tempSelections[step as keyof TempSelections] ? 'success' : 'secondary')}
              className="text-capitalize px-3 py-2"
              style={{ fontSize: '0.875rem' }}
            >
              {index + 1}. {step}{tempSelections[step as keyof TempSelections] ? 
                `: ${step === 'organism' ? tempSelections.organism?.common_name :
                 step === 'assembly' ? tempSelections.assembly?.assembly_name :
                 step === 'nomenclature' ? tempSelections.nomenclature :
                 step === 'source' ? tempSelections.source?.name :
                 step === 'version' ? tempSelections.version?.version_name : ''}` : 
                ''}
            </Badge>
            {index < steps.length - 1 && <span className="mx-2 text-muted">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'organism':
        return (
          <Row>
            {getAllOrganisms().map(organism => (
              <Col md={6} key={organism.taxonomy_id} className="mb-3">
                <SelectionCard 
                  title={organism.common_name} 
                  isSelected={tempSelections.organism?.taxonomy_id === organism.taxonomy_id}
                  onClick={() => handleSelection('organism', organism)} 
                />
              </Col>
            ))}
          </Row>
        );
      case 'assembly':
        if (!tempSelections.organism) return null;
        return (
          <Row>
            {getAllAssembliesForOrganism_byID(tempSelections.organism.taxonomy_id).map(assembly => (
              <Col md={6} key={assembly.assembly_id} className="mb-3">
                <SelectionCard 
                  title={assembly.assembly_name} 
                  subtitle={assembly.information}
                  isSelected={tempSelections.assembly?.assembly_id === assembly.assembly_id}
                  onClick={() => handleSelection('assembly', assembly)} 
                />
              </Col>
            ))}
          </Row>
        );
      case 'nomenclature':
        if (!tempSelections.assembly) return null;
        const assembly = tempSelections.assembly as Assembly;
        
        if (!assembly.nomenclatures?.length) {
          return <Alert variant="info">This assembly has no nomenclatures available.</Alert>;
        }

        return (
          <div>
            <p className="mb-3">Select a nomenclature system for <strong>{assembly.assembly_name}</strong>:</p>
            <Table striped hover>
              <thead>
                <tr>
                  <th>Nomenclature</th>
                  <th>Example Sequence Identifiers</th>
                </tr>
              </thead>
              <tbody>
                {assembly.nomenclatures.map(nomenclature => {
                  const examples = getSequenceNamesForAssemblyNomenclature(assembly, nomenclature);
                  const isSelected = tempSelections.nomenclature === nomenclature;
                  
                  return (
                    <tr 
                      key={nomenclature}
                      className={isSelected ? 'table-primary' : ''}
                      onClick={() => handleSelection('nomenclature', nomenclature)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <strong>{nomenclature}</strong>
                        {isSelected && <Badge bg="primary" className="ms-2">Selected</Badge>}
                      </td>
                      <td>
                        {examples.length > 0 ? (
                          <div className="small">
                            {examples.join(', ')}
                            {examples.length === 3 && <span className="text-muted">...</span>}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">No sequence data available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        );
      case 'source':
        if (!tempSelections.assembly) return null;
        return (
          <Row>
            {getAllSourcesForAssembly(tempSelections.assembly).map((source: Source) => (
              <Col md={6} key={source.source_id} className="mb-3">
                <SelectionCard 
                  title={source.name} 
                  subtitle={source.information}
                  isSelected={tempSelections.source?.source_id === source.source_id}
                  onClick={() => handleSelection('source', source)} 
                />
              </Col>
            ))}
          </Row>
        );
      case 'version':
        if (!tempSelections.source || !tempSelections.assembly) return null;
        return (
          <Row>
            {getAllVersionsForSourceAssembly(tempSelections.source, tempSelections.assembly).map((version: SourceVersion) => (
              <Col md={6} key={version.sv_id} className="mb-3">
                <SelectionCard 
                  title={version.version_name} 
                  subtitle={`Rank: ${version.version_rank}`}
                  isSelected={tempSelections.version?.sv_id === version.sv_id}
                  onClick={() => handleSelection('version', version)} 
                />
              </Col>
            ))}
          </Row>
        );
      default:
        return null;
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="lg"
      backdrop={canClose ? true : 'static'}
      keyboard={canClose}
    >
      <Modal.Header closeButton={canClose}>
        <Modal.Title>Configure Genome Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {renderBreadcrumb()}
        {renderStepContent()}
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button 
          variant="outline-secondary" 
          onClick={handleBack}
          disabled={currentStep === 'organism'}
          size="sm"
        >
          ← Back
        </Button>
        {currentStep === 'version' && (
          <Button 
            variant="primary" 
            onClick={handleConfirmSelection}
            disabled={!canProceed()}
            size="sm"
          >
            Confirm Selection
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AppSettingsModal;