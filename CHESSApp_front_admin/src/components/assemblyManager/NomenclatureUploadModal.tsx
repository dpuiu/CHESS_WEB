import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { useGetGlobalDataQuery } from '../../redux/api/apiSlice';

interface NomenclatureUploadModalProps {
  assemblyId: number;
  show: boolean;
  onSubmit: (uploadData: {
    tsv_file: File;
    source_nomenclature: string;
    new_nomenclature: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const NomenclatureUploadModal: React.FC<NomenclatureUploadModalProps> = ({
  assemblyId,
  show,
  onSubmit,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExistingNomenclature, setSelectedExistingNomenclature] = useState('');
  const [newNomenclatureName, setNewNomenclatureName] = useState('');
  const [tsvFile, setTsvFile] = useState<File | null>(null);

  // Get nomenclatures from global data
  const { data: globalData } = useGetGlobalDataQuery();
  const currentAssembly = globalData?.assemblies?.[assemblyId];
  const availableNomenclatures = currentAssembly?.nomenclatures || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExistingNomenclature && newNomenclatureName.trim() && tsvFile && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          tsv_file: tsvFile,
          source_nomenclature: selectedExistingNomenclature,
          new_nomenclature: newNomenclatureName.trim()
        });
        handleClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedExistingNomenclature('');
    setNewNomenclatureName('');
    setTsvFile(null);
    setIsSubmitting(false);
    onCancel();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.tsv') && !file.name.toLowerCase().endsWith('.txt')) {
        alert('Please select a valid TSV file (.tsv or .txt)');
        return;
      }
      setTsvFile(file);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-plus me-2"></i>
          Add New Nomenclature
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Step 1: Select Existing Nomenclature */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <i className="fas fa-list me-2"></i>
              Step 1: Select Source Nomenclature
            </Form.Label>
            <Form.Select
              value={selectedExistingNomenclature}
              onChange={(e) => setSelectedExistingNomenclature(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="">Choose a source nomenclature...</option>
              {availableNomenclatures.map((nom: string) => (
                <option key={nom} value={nom}>{nom}</option>
              ))}
            </Form.Select>
            {availableNomenclatures.length === 0 && (
              <Alert variant="warning" className="mt-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>No nomenclatures found for this assembly.</strong>
                <br />
                You can either:
                <ul className="mb-0 mt-1">
                  <li>Upload a FASTA file first to create a nomenclature, or</li>
                  <li>Enter a nomenclature name manually below</li>
                </ul>
              </Alert>
            )}
            {availableNomenclatures.length === 0 && (
              <div className="mt-2">
                <Form.Label>Or enter nomenclature name manually:</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedExistingNomenclature}
                  onChange={(e) => setSelectedExistingNomenclature(e.target.value)}
                  placeholder="e.g., UCSC, RefSeq, GENBANK"
                  disabled={isSubmitting}
                />
              </div>
            )}
            <Form.Text>
              Available nomenclatures: {availableNomenclatures.length} found
              {availableNomenclatures.length > 0 && ` (${availableNomenclatures.join(', ')})`}
            </Form.Text>
          </Form.Group>

          {/* Step 2: New Nomenclature Name */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <i className="fas fa-plus-circle me-2"></i>
              Step 2: New Nomenclature Name
            </Form.Label>
            <Form.Control
              type="text"
              value={newNomenclatureName}
              onChange={(e) => setNewNomenclatureName(e.target.value)}
              placeholder="e.g., RefSeq, Ensembl, Custom, NCBI"
              required
              disabled={isSubmitting}
            />
            <Form.Text>
              Enter the name for the new nomenclature that will be created
            </Form.Text>
          </Form.Group>

          {/* Step 3: Upload TSV File */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <i className="fas fa-file-upload me-2"></i>
              Step 3: Upload TSV File
            </Form.Label>
            <Form.Control
              type="file"
              accept=".tsv,.txt"
              onChange={handleFileChange}
              required
              disabled={isSubmitting}
            />
            <Form.Text>
              Upload a TSV file containing sequence name mappings. The file should have two columns:
              <br />
              <code>sequence_name_from_source_nomenclature</code> and <code>sequence_name_for_new_nomenclature</code>
            </Form.Text>
            {tsvFile && (
              <div className="mt-2">
                <small className="text-muted">
                  Selected: {tsvFile.name} ({(tsvFile.size / 1024).toFixed(2)} KB)
                </small>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedExistingNomenclature || !newNomenclatureName.trim() || !tsvFile}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            'Create Nomenclature'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NomenclatureUploadModal;