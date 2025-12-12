// Base file interface
export interface SourceFile {
  file_path: string;
  nomenclature: string;
  description: string;
  file_type?: 'gtf' | 'gff';
}

// File upload data interface
export interface FileUploadData {
  file: File;
  file_type: 'gtf' | 'gff' | 'fasta';
  description?: string;
  onProgress?: (progress: number) => void;
}

// Source version file upload data
export interface SourceVersionFileUploadData extends FileUploadData {
  sv_id: number;
  assembly_id: number;
}

// Assembly file upload data
export interface AssemblyFileUploadData extends FileUploadData {
  assembly_id: number;
  nomenclature: string;
}

// File validation result
export interface FileValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_lines: number;
    valid_lines: number;
    invalid_lines: number;
    feature_types: string[];
    seqids: string[];
  };
}

// File validation response
export interface FileValidationResponse {
  success: boolean;
  validation: FileValidationResult;
}

// Attribute information for GTF/GFF files
export interface AttributeInfo {
  type: 'categorical' | 'variable';
  values: string[];
  value_count: number | 'variable';
}

// Nomenclature detection result
export interface NomenclatureDetectionResult {
  detected_nomenclatures: [string, string[]][];
  attributes: Record<string, AttributeInfo>;
  file_sequences: string[];
  temp_file_path: string;
  norm_gtf_path: string;
  assembly_id: number;
  source_version_id: number;
  description: string;
}

// Attribute mapping configuration
export interface AttributeMapping {
  transcript_type_key: string;
  gene_type_key: string;
  gene_name_key: string;
  attribute_types: Record<string, 'categorical' | 'variable'>;
  categorical_attribute_values: Record<string, string[]>;
  excluded_attributes: string[]; // New field to track attributes that should not be stored
} 