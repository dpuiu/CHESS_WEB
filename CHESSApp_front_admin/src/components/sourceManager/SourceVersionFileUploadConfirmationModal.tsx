import React, { useState } from 'react';
import { AttributeInfo, AttributeMapping } from '../../types/file';

interface SourceVersionFileUploadConfirmationModalProps {
  isOpen: boolean;
  detectedNomenclatures: [string, string[]][]; // [nomenclature_name, missing_seqids[]]
  attributes: Record<string, AttributeInfo>;
  fileSequences: string[];
  onConfirm: (selectedNomenclature: string, attributeMapping: AttributeMapping) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

const SourceVersionFileUploadConfirmationModal: React.FC<SourceVersionFileUploadConfirmationModalProps> = ({
  isOpen,
  detectedNomenclatures,
  attributes,
  fileSequences,
  onConfirm,
  onCancel,
  onError
}) => {
  const [selectedNomenclature, setSelectedNomenclature] = useState<string>('');
  const [transcriptTypeKey, setTranscriptTypeKey] = useState<string>('');
  const [geneTypeKey, setGeneTypeKey] = useState<string>('');
  const [geneNameKey, setGeneNameKey] = useState<string>('');
  const [attributeTypes, setAttributeTypes] = useState<Record<string, 'categorical' | 'variable'>>({});
  const [excludedAttributes, setExcludedAttributes] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<'nomenclature' | 'attributes'>('nomenclature');

  // Get missing sequences for the selected nomenclature
  const selectedNomenclatureData = detectedNomenclatures.find(([name]) => name === selectedNomenclature);
  const missingSequences = selectedNomenclatureData ? selectedNomenclatureData[1] : [];

  // Initialize attribute types and excluded attributes
  React.useEffect(() => {
    const initialTypes: Record<string, 'categorical' | 'variable'> = {};
    Object.keys(attributes).forEach(attrName => {
      initialTypes[attrName] = attributes[attrName].type;
    });
    setAttributeTypes(initialTypes);
    setExcludedAttributes([]); // Reset excluded attributes
    
    // Debug logging
    console.log('Initializing attribute types:', initialTypes);
    console.log('Raw attributes:', attributes);
    console.log('Attribute names:', Object.keys(attributes));
    Object.keys(attributes).forEach(attrName => {
      console.log(`Attribute ${attrName}:`, attributes[attrName]);
    });
  }, [attributes]);

  // Set default values for required attribute mappings if they exist in attributes
  React.useEffect(() => {
    const attributeNames = Object.keys(attributes);
    
    // Helper function to find the best match for an attribute
    const findBestMatch = (targetNames: string[], currentValue: string): string | null => {
      if (currentValue) return null; // Don't override if already set
      
      // First try exact matches
      for (const targetName of targetNames) {
        if (attributeNames.includes(targetName)) {
          return targetName;
        }
      }
      
      // Then try case-insensitive matches
      for (const attrName of attributeNames) {
        for (const targetName of targetNames) {
          if (attrName.toLowerCase() === targetName.toLowerCase()) {
            return attrName;
          }
        }
      }
      
      // Finally try partial matches
      for (const attrName of attributeNames) {
        for (const targetName of targetNames) {
          if (attrName.toLowerCase().includes(targetName.toLowerCase()) || 
              targetName.toLowerCase().includes(attrName.toLowerCase())) {
            return attrName;
          }
        }
      }
      
      return null;
    };
    
    // Set default values for transcript_type if it exists
    const transcriptMatch = findBestMatch(['transcript_type', 'transcript_biotype', 'transcript_type_key'], transcriptTypeKey);
    if (transcriptMatch) {
      setTranscriptTypeKey(transcriptMatch);
    }
    
    // Set default values for gene_type if it exists
    const geneTypeMatch = findBestMatch(['gene_type', 'gene_biotype', 'gene_type_key'], geneTypeKey);
    if (geneTypeMatch) {
      setGeneTypeKey(geneTypeMatch);
    }
    
    // Set default values for gene_name if it exists
    const geneNameMatch = findBestMatch(['gene_name', 'gene_name_key', 'gene_id'], geneNameKey);
    if (geneNameMatch) {
      setGeneNameKey(geneNameMatch);
    }
  }, [attributes, transcriptTypeKey, geneTypeKey, geneNameKey]);

  const handleConfirm = async () => {
    if (!selectedNomenclature) {
      onError('Please select a nomenclature');
      return;
    }

    if (!transcriptTypeKey || !geneTypeKey || !geneNameKey) {
      onError('Please select all required attribute mappings');
      return;
    }

    setConfirming(true);
    try {
      // Extract categorical attribute values for processing
      const categoricalAttributeValues: Record<string, string[]> = {};
      
      // Use fallback types if attributeTypes is not initialized
      const typesToUse = Object.keys(attributeTypes).length === 0 ? 
        Object.fromEntries(Object.keys(attributes).map(attrName => [attrName, attributes[attrName].type])) : 
        attributeTypes;
      
      Object.keys(attributes).forEach(attrName => {
        // Check if this attribute is currently set as categorical in the UI
        console.log(`Checking attribute ${attrName}:`);
        console.log(`  - typesToUse[${attrName}] = ${typesToUse[attrName]}`);
        console.log(`  - attributes[${attrName}].values =`, attributes[attrName].values);
        console.log(`  - values length = ${attributes[attrName].values?.length || 0}`);
        
        if (typesToUse[attrName] === 'categorical' && attributes[attrName].values && attributes[attrName].values.length > 0) {
          categoricalAttributeValues[attrName] = attributes[attrName].values;
          console.log(`  - ADDED to categorical values`);
        } else {
          console.log(`  - NOT added to categorical values`);
        }
      });
      
      // Debug logging
      console.log('Final attribute types:', typesToUse);
      console.log('Final attributes data:', attributes);
      console.log('Final categorical attribute values:', categoricalAttributeValues);

      const attributeMapping: AttributeMapping = {
        transcript_type_key: transcriptTypeKey,
        gene_type_key: geneTypeKey,
        gene_name_key: geneNameKey,
        attribute_types: attributeTypes,
        categorical_attribute_values: categoricalAttributeValues,
        excluded_attributes: excludedAttributes
      };
      await onConfirm(selectedNomenclature, attributeMapping);
    } catch (error: any) {
      onError(error.message || 'Confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleAttributeTypeChange = (attrName: string, type: 'categorical' | 'variable') => {
    setAttributeTypes(prev => ({
      ...prev,
      [attrName]: type
    }));
  };

  if (!isOpen) return null;

  const attributeNames = Object.keys(attributes);

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-cog me-2"></i>
              Configure Annotation File
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              disabled={confirming}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'nomenclature' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nomenclature')}
                  disabled={confirming}
                >
                  <i className="fas fa-tag me-2"></i>
                  Nomenclature ({detectedNomenclatures.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'attributes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attributes')}
                  disabled={confirming}
                >
                  <i className="fas fa-list me-2"></i>
                  Attributes ({attributeNames.length})
                </button>
              </li>
            </ul>

            {/* Nomenclature Tab */}
            {activeTab === 'nomenclature' && (
              <div>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>File Analysis Complete:</strong> We found {detectedNomenclatures.length} nomenclature(s) 
                  that can be used with your file containing {fileSequences.length} sequences.
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-tag me-2"></i>
                    Select Nomenclature *
                  </label>
                  <select
                    className="form-select"
                    value={selectedNomenclature}
                    onChange={(e) => setSelectedNomenclature(e.target.value)}
                    disabled={confirming}
                  >
                    <option value="">Choose a nomenclature...</option>
                    {detectedNomenclatures.map(([nomenclature, missingSeqs]) => (
                      <option key={nomenclature} value={nomenclature}>
                        {nomenclature} {missingSeqs.length > 0 ? `(${missingSeqs.length} missing sequences)` : '(all sequences matched)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warning for missing sequences */}
                {selectedNomenclature && missingSequences.length > 0 && (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> {missingSequences.length} sequence identifier(s) from your file are not in the database for this nomenclature.
                    Features on these sequences will <strong>not</strong> be processed.
                    <details className="mt-2">
                      <summary className="text-muted" style={{ cursor: 'pointer' }}>
                        <small>Click to view missing sequences</small>
                      </summary>
                      <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <code className="small">
                          {missingSequences.join(', ')}
                        </code>
                      </div>
                    </details>
                  </div>
                )}

                {/* Success message if all sequences matched */}
                {selectedNomenclature && missingSequences.length === 0 && (
                  <div className="alert alert-success">
                    <i className="fas fa-check-circle me-2"></i>
                    <strong>All sequences matched:</strong> All {fileSequences.length} sequences in your file are present in the database for this nomenclature.
                  </div>
                )}

                <div className="alert alert-secondary">
                  <i className="fas fa-arrow-right me-2"></i>
                  <strong>Next Step:</strong> After selecting a nomenclature, you'll need to configure how the file attributes map to our system.
                </div>
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Attribute Configuration:</strong> Map your file attributes to our system and categorize them by type.
                  <br />
                  <small className="text-muted">
                    <i className="fas fa-magic me-1"></i>
                    Common attribute names like "transcript_type", "gene_type", and "gene_name" (and their variations) will be automatically selected if found in your file.
                  </small>
                </div>

                {/* Required Attribute Mappings */}
                <div className="card mb-3">
                  <div className="card-header bg-warning text-dark">
                    <h6 className="mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Required Attribute Mappings *
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">
                          Transcript Type
                          {transcriptTypeKey && Object.keys(attributes).includes(transcriptTypeKey) && (
                            <span className="badge bg-success ms-2">
                              <i className="fas fa-check me-1"></i>
                              Auto-set
                            </span>
                          )}
                        </label>
                        <select
                          className="form-select"
                          value={transcriptTypeKey}
                          onChange={(e) => setTranscriptTypeKey(e.target.value)}
                          disabled={confirming}
                        >
                          <option value="">Select attribute...</option>
                          {attributeNames.map((attrName) => (
                            <option key={attrName} value={attrName}>
                              {attrName} ({attributes[attrName].type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">
                          Gene Type
                          {geneTypeKey && Object.keys(attributes).includes(geneTypeKey) && (
                            <span className="badge bg-success ms-2">
                              <i className="fas fa-check me-1"></i>
                              Auto-set
                            </span>
                          )}
                        </label>
                        <select
                          className="form-select"
                          value={geneTypeKey}
                          onChange={(e) => setGeneTypeKey(e.target.value)}
                          disabled={confirming}
                        >
                          <option value="">Select attribute...</option>
                          {attributeNames.map((attrName) => (
                            <option key={attrName} value={attrName}>
                              {attrName} ({attributes[attrName].type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">
                          Gene Name
                          {geneNameKey && Object.keys(attributes).includes(geneNameKey) && (
                            <span className="badge bg-success ms-2">
                              <i className="fas fa-check me-1"></i>
                              Auto-set
                            </span>
                          )}
                        </label>
                        <select
                          className="form-select"
                          value={geneNameKey}
                          onChange={(e) => setGeneNameKey(e.target.value)}
                          disabled={confirming}
                        >
                          <option value="">Select attribute...</option>
                          {attributeNames.map((attrName) => (
                            <option key={attrName} value={attrName}>
                              {attrName} ({attributes[attrName].type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attribute Type Configuration */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Attribute Type Configuration
                    </h6>
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setExcludedAttributes([])}
                        disabled={confirming}
                        title="Include all attributes"
                      >
                        <i className="fas fa-check-square me-1"></i>
                        Check All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setExcludedAttributes(attributeNames)}
                        disabled={confirming}
                        title="Exclude all attributes"
                      >
                        <i className="fas fa-square me-1"></i>
                        Uncheck All
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Attribute Management:</strong> Choose which attributes to store and how to categorize them.
                      <br />
                      <small className="text-muted">
                        • <strong>Categorical:</strong> Attributes with a limited set of values (e.g., transcript types)
                        <br />
                        • <strong>Variable:</strong> Attributes with many unique values (e.g., gene names)
                        <br />
                        • <strong>Exclude:</strong> Attributes you don't want to store in the database
                      </small>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Include</th>
                            <th>Attribute Name</th>
                            <th>Type</th>
                            <th>Values</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attributeNames.map((attrName) => {
                            const attr = attributes[attrName];
                            const isExcluded = excludedAttributes.includes(attrName);
                            return (
                              <tr key={attrName} className={isExcluded ? 'table-secondary' : ''}>
                                <td>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={!isExcluded}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setExcludedAttributes(prev => prev.filter(name => name !== attrName));
                                        } else {
                                          setExcludedAttributes(prev => [...prev, attrName]);
                                        }
                                      }}
                                      disabled={confirming}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <strong>{attrName}</strong>
                                  {isExcluded && (
                                    <span className="badge bg-secondary ms-2">Excluded</span>
                                  )}
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={attributeTypes[attrName]}
                                    onChange={(e) => handleAttributeTypeChange(attrName, e.target.value as 'categorical' | 'variable')}
                                    disabled={confirming || isExcluded}
                                  >
                                    <option value="categorical">Categorical</option>
                                    <option value="variable">Variable</option>
                                  </select>
                                </td>
                                <td>
                                  {attr.type === 'categorical' ? (
                                    <span className="badge bg-success">
                                      {typeof attr.value_count === 'number' ? `${attr.value_count} values` : 'Variable'}
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning">Variable</span>
                                  )}
                                </td>
                                <td>
                                  {attr.type === 'categorical' && attr.values.length > 0 && !isExcluded && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-info"
                                      onClick={() => {
                                        alert(`Values for ${attrName}:\n${attr.values.slice(0, 10).join(', ')}${attr.values.length > 10 ? '...' : ''}`);
                                      }}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={confirming}
            >
              <i className="fas fa-times me-2"></i>
              Cancel
            </button>
            
            {activeTab === 'nomenclature' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('attributes')}
                disabled={!selectedNomenclature || confirming}
              >
                <i className="fas fa-arrow-right me-2"></i>
                Next: Configure Attributes
              </button>
            )}
            
            {activeTab === 'attributes' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!selectedNomenclature || !transcriptTypeKey || !geneTypeKey || !geneNameKey || confirming}
              >
                {confirming ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>
                    Confirm & Process
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceVersionFileUploadConfirmationModal; 