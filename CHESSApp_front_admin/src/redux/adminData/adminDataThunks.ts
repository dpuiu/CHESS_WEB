import { createAsyncThunk } from '@reduxjs/toolkit';
import { Organism, Assembly, Source, SourceVersion, SourceFile, Configuration, Dataset, DatabaseConfiguration } from '../../types/db_types';

const API_BASE_URL = 'http://localhost:5001/api';

export const fetchDatabaseList = createAsyncThunk(
  'adminData/fetchDatabaseList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/db_list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch database list';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTableData = createAsyncThunk(
  'adminData/fetchTableData',
  async ({ tableName, search, limit }: { tableName: string; search?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      
      const url = `${API_BASE_URL}/admin/db_table_data/${tableName}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch table data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const resetDatabase = createAsyncThunk(
  'adminData/resetDatabase',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reset_db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to reset database');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset database';
      return rejectWithValue(errorMessage);
    }
  }
);

export const clearTable = createAsyncThunk(
  'adminData/clearTable',
  async (tableName: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/clear_table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table_name: tableName }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to clear table');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear table';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createBackup = createAsyncThunk(
  'adminData/createBackup',
  async (backupPath: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/create_backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup_path: backupPath }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to create database backup');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create database backup';
      return rejectWithValue(errorMessage);
    }
  }
);

export const restoreBackup = createAsyncThunk(
  'adminData/restoreBackup',
  async ({ backupPath, storageDirPath }: { backupPath: string; storageDirPath: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/restore_backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup_path: backupPath, storage_dir_path: storageDirPath }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to restore database from backup');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore database from backup';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addOrganism = createAsyncThunk(
  'adminData/addOrganism',
  async (organismData: Organism, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/organisms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organismData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to add organism');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add organism';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateOrganism = createAsyncThunk(
  'adminData/updateOrganism',
  async ({ taxonomy_id, organismData }: {
    taxonomy_id: number;
    organismData: Organism;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/organisms/${taxonomy_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organismData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update organism');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update organism';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteOrganism = createAsyncThunk(
  'adminData/deleteOrganism',
  async (taxonomy_id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/organisms/${taxonomy_id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to delete organism');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete organism';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addAssembly = createAsyncThunk(
  'adminData/addAssembly',
  async (assemblyData: Assembly, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/assemblies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assemblyData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to add assembly');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add assembly';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateAssembly = createAsyncThunk(
  'adminData/updateAssembly',
  async ({ assembly_id, assemblyData }: {
    assembly_id: number;
    assemblyData: Assembly;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/assemblies/${assembly_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assemblyData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update assembly');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update assembly';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteAssembly = createAsyncThunk(
  'adminData/deleteAssembly',
  async (assembly_id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/assemblies/${assembly_id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to delete assembly');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete assembly';
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadFastaFile = createAsyncThunk(
  'adminData/uploadFastaFile',
  async ({ assembly_id, fasta_file, nomenclature, onProgress }: {
    assembly_id: number;
    fasta_file: File;
    nomenclature: string;
    onProgress?: (progress: number) => void;
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('fasta_file', fasta_file);
      formData.append('assembly_id', assembly_id.toString());
      formData.append('nomenclature', nomenclature);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
        
        // Handle response
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(rejectWithValue('Invalid response format'));
            }
          } else {
            try {
              const result = JSON.parse(xhr.responseText);
              reject(rejectWithValue(result.message || 'Failed to upload FASTA file'));
            } catch (error) {
              reject(rejectWithValue(`Upload failed with status ${xhr.status}`));
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(rejectWithValue('Network error during upload'));
        });
        
        xhr.addEventListener('timeout', () => {
          reject(rejectWithValue('Upload timeout - file may be too large'));
        });
        
        xhr.open('POST', `${API_BASE_URL}/admin/assemblies/upload-fasta`);
        xhr.timeout = 3600000;
        xhr.send(formData);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload FASTA file';
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadNomenclatureTsv = createAsyncThunk(
  'adminData/uploadNomenclatureTsv',
  async ({ assembly_id, tsv_file, source_nomenclature, new_nomenclature }: {
    assembly_id: number;
    tsv_file: File;
    source_nomenclature: string;
    new_nomenclature: string;
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('tsv_file', tsv_file);
      formData.append('source_nomenclature', source_nomenclature);
      formData.append('new_nomenclature', new_nomenclature);

      const response = await fetch(`${API_BASE_URL}/admin/assemblies/${assembly_id}/nomenclatures/upload-tsv`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to upload TSV file');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload TSV file';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeNomenclatureFromAssembly = createAsyncThunk(
  'adminData/removeNomenclatureFromAssembly',
  async ({ assembly_id, nomenclature }: {
    assembly_id: number;
    nomenclature: string;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/assemblies/${assembly_id}/nomenclatures/${encodeURIComponent(nomenclature)}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to remove nomenclature');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove nomenclature';
      return rejectWithValue(errorMessage);
    }
  }
);


// Source management thunks
export const addSource = createAsyncThunk(
  'adminData/addSource',
  async (sourceData: Source, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/add_to_source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to add source');
    }
  }
);

export const updateSource = createAsyncThunk(
  'adminData/updateSource',
  async ({ source_id, sourceData }: { source_id: number; sourceData: Source }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to update source');
    }
  }
);

export const deleteSource = createAsyncThunk(
  'adminData/deleteSource',
  async (source_id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to delete source');
    }
  }
);

// Source version management thunks
export const addSourceVersion = createAsyncThunk(
  'adminData/addSourceVersion',
  async ({ source_id, svData }: { source_id: number; svData: SourceVersion }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(svData),
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to add source version');
    }
  }
);

export const updateSourceVersion = createAsyncThunk(
  'adminData/updateSourceVersion',
  async ({ source_id, sv_id, svData }: { source_id: number; sv_id: number; svData: SourceVersion }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/${sv_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(svData),
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to update source version');
    }
  }
);

export const deleteSourceVersion = createAsyncThunk(
  'adminData/deleteSourceVersion',
  async ({ source_id, sv_id }: { source_id: number; sv_id: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/${sv_id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to delete source version');
    }
  }
);

export const validateSourceFile = createAsyncThunk(
  'adminData/validateSourceFile',
  async ({ source_id, file }: { source_id: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/validate-file`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to validate file');
    }
  }
);

export const reorderSourceVersions = createAsyncThunk(
  'adminData/reorderSourceVersions',
  async ({ source_id, new_order }: { source_id: number; new_order: number[] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_order }),
      });
      
      const result = await response.json();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue('Failed to reorder source versions');
    }
  }
);

export const uploadSourceVersionFile = createAsyncThunk(
  'adminData/uploadSourceVersionFile',
  async (uploadData: { source_id: number; sv_id: number; file: File; assembly_id: number; file_type: string; description?: string; onProgress?: (progress: number) => void }, { rejectWithValue }) => {
    try {
      const { source_id, sv_id, file, assembly_id, description, onProgress } = uploadData;
      const formData = new FormData();
      formData.append('gtf_file', file);
      formData.append('assembly_id', assembly_id.toString());
      if (description) {
        formData.append('description', description);
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
        
        // Handle response
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(rejectWithValue('Invalid response format'));
            }
          } else {
            try {
              const result = JSON.parse(xhr.responseText);
              reject(rejectWithValue(result.message || 'Failed to upload file'));
            } catch (error) {
              reject(rejectWithValue(`Upload failed with status ${xhr.status}`));
            }
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          reject(rejectWithValue('Network error during upload'));
        });
        
        xhr.addEventListener('timeout', () => {
          reject(rejectWithValue('Upload timeout - file may be too large'));
        });
        
        // Configure and send request
        xhr.open('POST', `${API_BASE_URL}/admin/sources/${source_id}/source-versions/${sv_id}/upload-gtf`);
        xhr.timeout = 3600000; // 1 hour timeout
        xhr.send(formData);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      return rejectWithValue(errorMessage);
    }
  }
);

export const confirmAnnotationUpload = createAsyncThunk(
  'adminData/confirmAnnotationUpload',
  async ({ source_id, sv_id, confirmationData }: {
    source_id: number;
    sv_id: number;
    confirmationData: {
      selected_nomenclature: string;
      transcript_type_key: string;
      gene_type_key: string;
      gene_name_key: string;
      attribute_types: Record<string, 'categorical' | 'variable'>;
      categorical_attribute_values: Record<string, string[]>;
      excluded_attributes: string[];
      temp_file_path: string;
      norm_gtf_path: string;
      assembly_id: number;
      source_version_id: number;
      description: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/${sv_id}/confirm-annotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to confirm annotation upload');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm annotation upload';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeSourceVersionAssembly = createAsyncThunk(
  'adminData/removeSourceVersionAssembly',
  async ({ source_id, sv_id, sva_id }: {
    source_id: number;
    sv_id: number;
    sva_id: number;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sources/${source_id}/source-versions/${sv_id}/assemblies/${sva_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to remove assembly');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove assembly';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeSourceVersionFile = createAsyncThunk(
  'adminData/removeSourceVersionFile',
  async (sourceFileID: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/source-versions/files/${sourceFileID}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to remove file');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove file';
      return rejectWithValue(errorMessage);
    }
  }
);

// ============================================================================
// CONFIGURATION MANAGEMENT THUNKS
// ============================================================================

export const createConfiguration = createAsyncThunk(
  'adminData/createConfiguration',
  async (configData: Configuration, { rejectWithValue }) => {
    console.log('Creating configuration with data:', configData);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configurations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to create configuration');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create configuration';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateConfiguration = createAsyncThunk(
  'adminData/updateConfiguration',
  async (configData: Configuration, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configurations/${configData.configuration_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update configuration');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteConfiguration = createAsyncThunk(
  'adminData/deleteConfiguration',
  async (configurationId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configurations/${configurationId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to delete configuration');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
      return rejectWithValue(errorMessage);
    }
  }
);

export const activateConfiguration = createAsyncThunk(
  'adminData/activateConfiguration',
  async (configurationId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configurations/${configurationId}/activate`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to activate configuration');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate configuration';
      return rejectWithValue(errorMessage);
    }
  }
); 

// ============================================================================
// DATASET MANAGEMENT THUNKS
// ============================================================================

export const createDataset = createAsyncThunk(
  'adminData/createDataset',
  async (datasetData: Partial<Dataset> & { file?: File; sva_id?: number }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('name', datasetData.name!);
      formData.append('description', datasetData.description!);
      formData.append('data_type', datasetData.data_type!);
      formData.append('data_target', datasetData.data_target!);
      
      if (datasetData.sva_id) {
        formData.append('sva_id', datasetData.sva_id.toString());
      }
      
      if (datasetData.file) {
        formData.append('file', datasetData.file);
      }

      const response = await fetch(`${API_BASE_URL}/admin/datasets`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to create dataset');
      }
      
      return result.dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dataset';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDataset = createAsyncThunk(
  'adminData/updateDataset',
  async ({ datasetId, datasetData }: { datasetId: number; datasetData: Partial<Dataset> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/${datasetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update dataset');
      }
      
      return result.dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update dataset';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteDataset = createAsyncThunk(
  'adminData/deleteDataset',
  async (datasetId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/${datasetId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to delete dataset');
      }
      
      return { datasetId, message: result.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dataset';
      return rejectWithValue(errorMessage);
    }
  }
);

export const uploadTranscriptData = createAsyncThunk(
  'adminData/uploadTranscriptData',
  async (uploadData: {
    dataset_id: number;
    sva_id: number;
    data_type: string;
    file: File;
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('dataset_id', uploadData.dataset_id.toString());
      formData.append('sva_id', uploadData.sva_id.toString());
      formData.append('data_type', uploadData.data_type);
      formData.append('file', uploadData.file);

      const response = await fetch(`${API_BASE_URL}/admin/datasets/${uploadData.dataset_id}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to upload transcript data');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload transcript data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createDataType = createAsyncThunk(
  'adminData/createDataType',
  async (dataTypeData: { data_type: string; description: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/add_data_type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTypeData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to create data type');
      }
      
      return result.data_type;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create data type';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDataType = createAsyncThunk(
  'adminData/updateDataType',
  async ({ dataType, dataTypeData }: { dataType: string; dataTypeData: Partial<{ data_type: string; description: string }> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/edit_data_type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_type: dataType,
          description: dataTypeData.description || ''
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to update data type');
      }
      
      return result.data_type;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update data type';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteDataType = createAsyncThunk(
  'adminData/deleteDataType',
  async (dataType: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/delete_data_type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data_type: dataType }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(result.message || 'Failed to delete data type');
      }
      
      return { dataType, message: result.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete data type';
      return rejectWithValue(errorMessage);
    }
  }
); 