import React, { useState, useEffect } from 'react';
import { SourceVersion, Assembly, Organism } from '../../types/db_types';

interface SourceVersionFileUploadFormProps {
  sourceVersion: SourceVersion;
  organisms: Organism[];
  assemblies: Assembly[];
  selectedAssembly?: Assembly | null;
  onSubmit: (file: File, svId: number, assemblyId: number, fileType: 'gtf' | 'gff', description: string, onProgress?: (progress: number) => void) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const SourceVersionFileUploadForm: React.FC<SourceVersionFileUploadFormProps> = ({ 
  sourceVersion, 
  organisms,
  assemblies, 
  selectedAssembly,
  onSubmit, 
  onCancel, 
  onError, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    organism_id: '',
    assembly_id: '',
    file_type: 'gtf' as 'gtf' | 'gff',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pre-select assembly if provided
  useEffect(() => {
    if (selectedAssembly) {
      setFormData(prev => ({
        ...prev,
        organism_id: selectedAssembly.taxonomy_id.toString(),
        assembly_id: selectedAssembly.assembly_id.toString(),
      }));
    }
  }, [selectedAssembly]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      const isGtf = fileName.endsWith('.gtf');
      const isGff = fileName.endsWith('.gff') || fileName.endsWith('.gff3');
      
      if (!isGtf && !isGff) {
        onError('Please select a valid GTF or GFF file (.gtf, .gff, or .gff3)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      onError('Please select a GTF/GFF file');
      return;
    }

    if (!formData.organism_id) {
      onError('Please select an organism');
      return;
    }

    if (!formData.assembly_id) {
      onError('Please select an assembly');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await onSubmit(
        selectedFile,
        sourceVersion.sv_id,
        parseInt(formData.assembly_id),
        formData.file_type,
        formData.description,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );
      onSuccess();
    } catch (error: any) {
      onError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox input
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData(prev => {
      // If organism changes, reset assembly selection
      if (name === 'organism_id') {
        return {
          ...prev,
          organism_id: value,
          assembly_id: '', // Reset assembly when organism changes
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold">
            <i className="fas fa-file me-2"></i>
            GTF/GFF File *
          </label>
          <input
            type="file"
            className="form-control"
            accept=".gtf,.gff,.gff3"
            onChange={handleFileChange}
            disabled={uploading}
            required
          />
          <div className="form-text">
            Select a GTF or GFF file containing annotation data.
          </div>
          {selectedFile && (
            <div className="mt-2">
              <div className="alert alert-success py-2">
                <i className="fas fa-check-circle me-2"></i>
                <strong>Selected:</strong> {selectedFile.name}
                <br />
                <small className="text-muted">
                  Detected type: <span className="badge bg-info">{formData.file_type.toUpperCase()}</span>
                </small>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <label className="form-label fw-bold">
            <i className="fas fa-leaf me-2"></i>
            Organism *
          </label>
          <select
            className="form-select"
            name="organism_id"
            value={formData.organism_id}
            onChange={handleChange}
            disabled={uploading || !!selectedAssembly}
            required
          >
            <option value="">Select an organism...</option>
            {organisms.map((organism) => (
              <option key={organism.taxonomy_id} value={organism.taxonomy_id}>
                {organism.scientific_name} ({organism.common_name})
              </option>
            ))}
          </select>
          <div className="form-text">
            {selectedAssembly ? 
              `Pre-selected for assembly: ${selectedAssembly.assembly_name}` : 
              'Select the organism this annotation file corresponds to.'
            }
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">
            <i className="fas fa-database me-2"></i>
            Assembly *
          </label>
          <select
            className="form-select"
            name="assembly_id"
            value={formData.assembly_id}
            onChange={handleChange}
            disabled={uploading || !formData.organism_id || !!selectedAssembly}
            required
          >
            <option value="">{formData.organism_id ? 'Select an assembly...' : 'Select an organism first...'}</option>
            {formData.organism_id && assemblies
              .filter(assembly => assembly.taxonomy_id === parseInt(formData.organism_id))
              .map((assembly) => (
                <option key={assembly.assembly_id} value={assembly.assembly_id}>
                  {assembly.assembly_name} - {assembly.information}
                </option>
              ))}
          </select>
          <div className="form-text">
            {selectedAssembly ? 
              `Pre-selected: ${selectedAssembly.assembly_name}` : 
              'Select the assembly this annotation file corresponds to. Assemblies are filtered by the selected organism.'
            }
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">
            <i className="fas fa-info-circle me-2"></i>
            Description
          </label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description of this annotation file..."
            rows={3}
            disabled={uploading}
          />
          <div className="form-text">
            Provide an optional description to help identify this file.
          </div>
        </div>

        {uploading && (
          <div className="mb-3">
            <div className="alert alert-warning">
              <i className="fas fa-clock me-2"></i>
              <strong>Processing...</strong> Please wait while we upload and process your annotation file.
            </div>
            <div className="progress mb-2">
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
            <div className="form-text">
              <i className="fas fa-spinner fa-spin me-1"></i>
              Uploading and processing annotation file... This may take a few minutes for large files.
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="btn btn-secondary"
          >
            <i className="fas fa-times me-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !selectedFile || !formData.organism_id || !formData.assembly_id}
            className="btn btn-primary"
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload me-2"></i>
                Upload Annotation File
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SourceVersionFileUploadForm; 