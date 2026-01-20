import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useGetGlobalDataQuery } from '../../redux/api/apiSlice';
import { Dataset, OptionData } from '../../types';

interface DatasetFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (datasetData: Partial<Dataset> & { file?: File; sva_id: number }) => Promise<void>;
  dataset?: Dataset | null;
  loading?: boolean;
}

interface OptionDataWithArrays {
  organisms: Array<{ taxonomy_id: number; scientific_name: string; common_name: string }>;
  assemblies: Array<{ assembly_id: number; assembly_name: string }>;
  sources: Array<{ source_id: number; name: string }>;
  versions: Array<{ sv_id: number; version_name: string }>;
}

export const DatasetForm: React.FC<DatasetFormProps> = ({
  show,
  onHide,
  onSubmit,
  dataset,
  loading = false
}) => {
  const { data: globalData } = useGetGlobalDataQuery();
  const organisms = globalData?.organisms;
  const assemblies = globalData?.assemblies;
  const sources = globalData?.sources;
  const data_types = globalData?.datasets?.data_types;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    data_type: '',
    data_target: 'transcripts' as 'transcripts' | 'genes',
    organism_id: '',
    assembly_id: '',
    source_id: '',
    sv_id: '',
    file: null as File | null
  });

  const [options, setOptions] = useState<OptionDataWithArrays>({
    organisms: [],
    assemblies: [],
    sources: [],
    versions: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      // Populate organisms from globalData
      const organismsArray = organisms ? Object.values(organisms) : [];

      setOptions(prev => ({
        ...prev,
        organisms: organismsArray.map((org: any) => ({
          taxonomy_id: org.taxonomy_id,
          scientific_name: org.scientific_name,
          common_name: org.common_name
        }))
      }));

      if (dataset) {
        setFormData({
          name: dataset.name,
          description: dataset.description,
          data_type: dataset.data_type,
          data_target: dataset.data_target,
          organism_id: '',
          assembly_id: '',
          source_id: '',
          sv_id: '',
          file: null
        });
      } else {
        setFormData({
          name: '',
          description: '',
          data_type: '',
          data_target: 'transcripts',
          organism_id: '',
          assembly_id: '',
          source_id: '',
          sv_id: '',
          file: null
        });
      }
      setError(null);
    }
  }, [dataset, show, organisms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Dataset name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Dataset description is required');
      return;
    }

    if (!formData.data_type.trim()) {
      setError('Data type is required');
      return;
    }

    try {
      // Calculate SVA automatically from the selected options
      const sva_id = calculateSVAFromSelections(
        parseInt(formData.organism_id),
        parseInt(formData.assembly_id),
        parseInt(formData.source_id),
        parseInt(formData.sv_id)
      );

      const submitData = {
        name: formData.name,
        description: formData.description,
        data_type: formData.data_type,
        data_target: formData.data_target,
        ...(formData.file && { file: formData.file }),
        sva_id
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || 'Failed to save dataset');
    }
  };

  // Helper functions to load data from globalData
  const loadAssembliesFromGlobalData = (organismId: number) => {
    const assembliesArray = assemblies ? Object.values(assemblies) : [];
    const organismAssemblies = assembliesArray.filter((assembly: any) => assembly.taxonomy_id === organismId);

    setOptions(prev => ({
      ...prev,
      assemblies: organismAssemblies.map((assembly: any) => ({
        assembly_id: assembly.assembly_id,
        assembly_name: assembly.assembly_name
      }))
    }));
  };

  const loadSourcesForAssembly = (assemblyId: number) => {
    const sourcesArray = sources ? Object.values(sources) : [];
    const validSources: Array<{ source_id: number; name: string }> = [];

    // Find sources that have source version assemblies on the selected assembly
    for (const source of sourcesArray as any[]) {
      if (source.versions) {
        for (const version of Object.values(source.versions) as any[]) {
          if (version.assemblies) {
            // Check if any assembly in this version matches the selected assembly
            const hasAssembly = Object.values(version.assemblies).some(
              (assembly: any) => assembly.assembly_id === assemblyId
            );
            if (hasAssembly) {
              validSources.push({
                source_id: source.source_id,
                name: source.name
              });
              break;
            }
          }
        }
      }
    }

    setOptions(prev => ({
      ...prev,
      sources: validSources
    }));
  };

  const loadSourceVersionsFromGlobalData = (sourceId: number) => {
    const sourcesArray = sources ? Object.values(sources) : [];
    const source = sourcesArray.find((source: any) => source.source_id === sourceId) as any;

    if (source?.versions) {
      const versionsArray = Object.values(source.versions) as any[];
      setOptions(prev => ({
        ...prev,
        versions: versionsArray.map(version => ({
          sv_id: version.sv_id,
          version_name: version.version_name
        }))
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);

    // Handle cascading dropdowns
    if (field === 'organism_id' && value) {
      loadAssembliesFromGlobalData(parseInt(value));
      // Reset dependent fields
      setFormData(prev => ({
        ...prev,
        assembly_id: '',
        source_id: '',
        sv_id: ''
      }));
      setOptions(prev => ({
        ...prev,
        sources: [],
        versions: []
      }));
    } else if (field === 'assembly_id' && value) {
      loadSourcesForAssembly(parseInt(value));
      // Reset dependent fields
      setFormData(prev => ({
        ...prev,
        source_id: '',
        sv_id: ''
      }));
      setOptions(prev => ({
        ...prev,
        versions: []
      }));
    } else if (field === 'source_id' && value) {
      loadSourceVersionsFromGlobalData(parseInt(value));
      // Reset dependent fields
      setFormData(prev => ({
        ...prev,
        sv_id: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      file
    }));
    if (error) setError(null);
  };

  // Calculate SVA automatically from the selected options
  const calculateSVAFromSelections = (organismId: number, assemblyId: number, sourceId: number, svId: number): number => {
    const sourcesArray = sources ? Object.values(sources) : [];

    for (const source of sourcesArray as any[]) {
      if (source.source_id === sourceId && source.versions) {
        for (const version of Object.values(source.versions) as any[]) {
          if (version.sv_id === svId && version.assemblies) {
            // Find the SVA that matches the assembly
            for (const sva of Object.values(version.assemblies) as any[]) {
              if (sva.assembly_id === assemblyId) {
                return sva.sva_id;
              }
            }
          }
        }
      }
    }

    throw new Error('No matching source version assembly found for the selected options');
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {dataset ? 'Edit Dataset' : 'Create New Dataset'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Dataset Name *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter dataset name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter dataset description"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data Type *</Form.Label>
            <Form.Select
              value={formData.data_type}
              onChange={(e) => handleInputChange('data_type', e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a data type...</option>
              {Object.values(data_types || {}).map((dataType: any) => (
                <option key={dataType.data_type} value={dataType.data_type}>
                  {dataType.data_type}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Select a data type from the available options. If no data types exist, please create one first.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data Target *</Form.Label>
            <Form.Select
              value={formData.data_target}
              onChange={(e) => handleInputChange('data_target', e.target.value as 'transcripts' | 'genes')}
              required
              disabled={loading}
            >
              <option value="transcripts">Transcripts</option>
              <option value="genes">Genes</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Select whether the data is for transcripts or genes.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Organism *</Form.Label>
            <Form.Select
              value={formData.organism_id}
              onChange={(e) => handleInputChange('organism_id', e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select an organism...</option>
              {options.organisms.map((organism) => (
                <option key={organism.taxonomy_id} value={organism.taxonomy_id}>
                  {organism.scientific_name} ({organism.common_name})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assembly *</Form.Label>
            <Form.Select
              value={formData.assembly_id}
              onChange={(e) => handleInputChange('assembly_id', e.target.value)}
              required
              disabled={loading || !formData.organism_id}
            >
              <option value="">{formData.organism_id ? 'Select an assembly...' : 'Select an organism first...'}</option>
              {options.assemblies.map((assembly) => (
                <option key={assembly.assembly_id} value={assembly.assembly_id}>
                  {assembly.assembly_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Source *</Form.Label>
            <Form.Select
              value={formData.source_id}
              onChange={(e) => handleInputChange('source_id', e.target.value)}
              required
              disabled={loading || !formData.assembly_id}
            >
              <option value="">{formData.assembly_id ? 'Select a source...' : 'Select an assembly first...'}</option>
              {options.sources.map((source) => (
                <option key={source.source_id} value={source.source_id}>
                  {source.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Source Version *</Form.Label>
            <Form.Select
              value={formData.sv_id}
              onChange={(e) => handleInputChange('sv_id', e.target.value)}
              required
              disabled={loading || !formData.source_id}
            >
              <option value="">{formData.source_id ? 'Select a version...' : 'Select a source first...'}</option>
              {options.versions.map((version) => (
                <option key={version.sv_id} value={version.sv_id}>
                  {version.version_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>TSV File *</Form.Label>
            <Form.Control
              type="file"
              accept=".tsv"
              onChange={handleFileChange}
              required
            />
            <Form.Text className="text-muted">
              {formData.data_target === 'transcripts' && 'Upload a TSV file with columns: transcript_id, data'}
              {formData.data_target === 'genes' && 'Upload a TSV file with columns: gene_id, data'}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              dataset ? 'Update Dataset' : 'Create Dataset'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};