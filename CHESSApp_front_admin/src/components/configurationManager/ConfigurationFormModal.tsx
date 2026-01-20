import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useGetGlobalDataQuery } from '../../redux/api/apiSlice';
import { Configuration } from '../../types';

interface ConfigurationFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (configData: Configuration) => void;
  configuration: Configuration | null;
  isEditing: boolean;
  loading?: boolean;
}

const initialFormState = {
  description: '',
  organism_id: '',
  assembly_id: '',
  nomenclature: '',
  sequence_id: '',
  start: '',
  end: '',
  source_id: '',
  sv_id: '',
  set_active: false
};

const ConfigurationFormModal: React.FC<ConfigurationFormModalProps> = ({
  show,
  onClose,
  onSubmit,
  configuration,
  isEditing,
  loading = false
}) => {
  const { data: globalData } = useGetGlobalDataQuery();
  const organisms = globalData?.organisms;
  const assemblies = globalData?.assemblies;
  const sources = globalData?.sources;

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (!show) return;
    setError(null);

    if (isEditing && configuration) {
      setFormData({
        description: configuration.description,
        organism_id: configuration.organism_id.toString(),
        assembly_id: configuration.assembly_id.toString(),
        nomenclature: configuration.nomenclature,
        sequence_id: configuration.sequence_id || '',
        start: configuration.start ? configuration.start.toString() : '',
        end: configuration.end ? configuration.end.toString() : '',
        source_id: configuration.source_id.toString(),
        sv_id: configuration.sv_id.toString(),
        set_active: configuration.active
      });
    } else {
      setFormData(initialFormState);
    }
  }, [show, isEditing, configuration]);

  // --- Derive options directly from globalData ---
  const organismList = organisms ? Object.values(organisms) : [];

  const assemblyList = formData.organism_id && assemblies
    ? Object.values(assemblies).filter((a: any) => a.taxonomy_id === parseInt(formData.organism_id))
    : [];

  const selectedAssembly: any = formData.assembly_id && assemblies
    ? Object.values(assemblies).find((a: any) => a.assembly_id === parseInt(formData.assembly_id))
    : null;

  const nomenclatureList = selectedAssembly?.nomenclatures || [];

  // Sequences for the selected nomenclature
  const sequenceList = (formData.nomenclature && selectedAssembly?.sequence_id_mappings)
    ? Object.entries(selectedAssembly.sequence_id_mappings)
      .filter(([, info]: [string, any]) => formData.nomenclature in info.nomenclatures)
      .map(([db_seqid, info]: [string, any]) => ({
        name: info.nomenclatures[formData.nomenclature],
        sequence_id: db_seqid,
        length: info.length
      }))
    : [];

  // Get selected sequence's length for coordinate validation
  const selectedSequence = sequenceList.find(s => s.sequence_id.toString() === formData.sequence_id);
  const maxCoord = selectedSequence?.length || 0;

  // Sources that have files for the selected assembly
  const sourceList = formData.assembly_id && sources
    ? Object.values(sources).filter((source: any) =>
      source.versions && Object.values(source.versions).some((version: any) =>
        version.assemblies && Object.values(version.assemblies).some(
          (sva: any) => sva.assembly_id === parseInt(formData.assembly_id)
        )
      )
    )
    : [];

  const selectedSource: any = formData.source_id && sources
    ? Object.values(sources).find((s: any) => s.source_id === parseInt(formData.source_id))
    : null;

  const versionList = selectedSource?.versions ? Object.values(selectedSource.versions) : [];

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Cast to HTMLInputElement to access .checked safely
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };

      // Reset downstream fields on cascading changes
      if (name === 'organism_id') {
        updated.assembly_id = '';
        updated.nomenclature = '';
        updated.sequence_id = '';
        updated.start = '';
        updated.end = '';
        updated.source_id = '';
        updated.sv_id = '';
      } else if (name === 'assembly_id') {
        updated.nomenclature = '';
        updated.sequence_id = '';
        updated.start = '';
        updated.end = '';
        updated.source_id = '';
        updated.sv_id = '';
      } else if (name === 'nomenclature') {
        updated.sequence_id = '';
        updated.start = '';
        updated.end = '';
      } else if (name === 'sequence_id') {
        updated.start = '';
        updated.end = '';
      } else if (name === 'source_id') {
        updated.sv_id = '';
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      return setError('Description is required');
    }
    if (!formData.organism_id || !formData.assembly_id || !formData.nomenclature ||
      !formData.sequence_id || !formData.start || !formData.end ||
      !formData.source_id || !formData.sv_id) {
      return setError('All fields are required');
    }

    const start = parseInt(formData.start);
    const end = parseInt(formData.end);
    if (start > end) {
      return setError('Start coordinate must be less than or equal to end coordinate');
    }

    onSubmit({
      configuration_id: configuration?.configuration_id || 0,
      active: formData.set_active as boolean,
      description: formData.description.trim(),
      organism_id: parseInt(formData.organism_id),
      assembly_id: parseInt(formData.assembly_id),
      nomenclature: formData.nomenclature,
      sequence_id: formData.sequence_id,
      start,
      end,
      source_id: parseInt(formData.source_id),
      sv_id: parseInt(formData.sv_id)
    } as Configuration);
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setError(null);
    onClose();
  };

  const canSubmit = !loading && formData.description.trim() &&
    formData.organism_id && formData.assembly_id && formData.nomenclature &&
    formData.sequence_id && formData.start && formData.end &&
    formData.source_id && formData.sv_id;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-cog me-2" />
          {isEditing ? 'Edit Configuration' : 'Add New Configuration'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this configuration..."
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Organism *</Form.Label>
            <Form.Select
              name="organism_id"
              value={formData.organism_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select an organism...</option>
              {organismList.map((org: any) => (
                <option key={org.taxonomy_id} value={org.taxonomy_id}>
                  {org.scientific_name} ({org.common_name})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assembly *</Form.Label>
            <Form.Select
              name="assembly_id"
              value={formData.assembly_id}
              onChange={handleChange}
              disabled={loading || !formData.organism_id}
            >
              <option value="">{formData.organism_id ? 'Select an assembly...' : 'Select organism first...'}</option>
              {assemblyList.map((asm: any) => (
                <option key={asm.assembly_id} value={asm.assembly_id}>
                  {asm.assembly_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nomenclature *</Form.Label>
            <Form.Select
              name="nomenclature"
              value={formData.nomenclature}
              onChange={handleChange}
              disabled={loading || !formData.assembly_id}
            >
              <option value="">{formData.assembly_id ? 'Select nomenclature...' : 'Select assembly first...'}</option>
              {nomenclatureList.map(nom => (
                <option key={nom} value={nom}>{nom}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sequence *</Form.Label>
            <Form.Select
              name="sequence_id"
              value={formData.sequence_id}
              onChange={handleChange}
              disabled={loading || !formData.nomenclature}
            >
              <option value="">{formData.nomenclature ? 'Select sequence...' : 'Select nomenclature first...'}</option>
              {sequenceList.map(seq => (
                <option key={seq.sequence_id} value={seq.sequence_id}>
                  {seq.name} ({seq.length.toLocaleString()} bp)
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Coordinates *</Form.Label>
            <div className="d-flex gap-3">
              <div className="flex-fill">
                <Form.Control
                  type="number"
                  name="start"
                  value={formData.start}
                  onChange={handleChange}
                  placeholder="Start"
                  min={1}
                  max={maxCoord || undefined}
                  disabled={loading || !formData.sequence_id}
                />
                <Form.Text>Start (1-based)</Form.Text>
              </div>
              <div className="flex-fill">
                <Form.Control
                  type="number"
                  name="end"
                  value={formData.end}
                  onChange={handleChange}
                  placeholder="End"
                  min={formData.start ? parseInt(formData.start) : 1}
                  max={maxCoord || undefined}
                  disabled={loading || !formData.sequence_id}
                />
                <Form.Text>End</Form.Text>
              </div>
            </div>
            {selectedSequence && (
              <Form.Text className="text-muted">
                Sequence length: {selectedSequence.length.toLocaleString()} bp
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Source *</Form.Label>
            <Form.Select
              name="source_id"
              value={formData.source_id}
              onChange={handleChange}
              disabled={loading || !formData.assembly_id}
            >
              <option value="">{formData.assembly_id ? 'Select source...' : 'Select assembly first...'}</option>
              {sourceList.map((src: any) => (
                <option key={src.source_id} value={src.source_id}>{src.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Source Version *</Form.Label>
            <Form.Select
              name="sv_id"
              value={formData.sv_id}
              onChange={handleChange}
              disabled={loading || !formData.source_id}
            >
              <option value="">{formData.source_id ? 'Select version...' : 'Select source first...'}</option>
              {versionList.map((ver: any) => (
                <option key={ver.sv_id} value={ver.sv_id}>{ver.version_name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="set_active"
              checked={formData.set_active}
              onChange={handleChange}
              label="Set as active configuration"
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Only one configuration can be active at a time.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? (
            <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
          ) : (
            isEditing ? 'Update' : 'Create'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfigurationFormModal;