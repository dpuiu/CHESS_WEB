import { createAsyncThunk } from '@reduxjs/toolkit';
import { setDownloadsLoading, setDownloadsData, setDownloadsError } from './downloadsSlice';
import { DownloadFile } from '../../types/downloadsTypes';
import { SourceVersionAssembly } from '../../types/dbTypes';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchDownloadFiles = createAsyncThunk(
  'downloads/fetchDownloadFiles',
  async ({ assembly_id, nomenclature, source, version, assembly_name }: {
    assembly_id: number;
    nomenclature: string;
    assembly_name: string;
    source?: any;
    version?: any;
  }, { dispatch }) => {
    dispatch(setDownloadsLoading());
    
    try {
      const files: DownloadFile[] = [];
      
      // Add assembly-level files (FASTA and FAI)
      files.push({
        id: `fasta-${assembly_id}-${nomenclature}`,
        name: `${assembly_name}_${nomenclature}.fasta`,
        description: 'Complete genome sequence in FASTA format',
        type: 'fasta',
        downloadUrl: `${API_BASE_URL}/public/fasta/${assembly_id}/${encodeURIComponent(nomenclature)}`,
        assembly_id,
        nomenclature,
      });
      
      files.push({
        id: `fai-${assembly_id}-${nomenclature}`,
        name: `${assembly_name}_${nomenclature}.fai`,
        description: 'FASTA index file for fast access',
        type: 'fai',
        downloadUrl: `${API_BASE_URL}/public/fai/${assembly_id}/${encodeURIComponent(nomenclature)}`,
        assembly_id,
        nomenclature,
      });
      
      // Add source-specific files if source and version are selected
      if (source && version && version.assemblies) {
        // Find the sva_id for the current assembly
        const svaEntries = Object.values(version.assemblies) as SourceVersionAssembly[];
        const svaEntry = svaEntries.find(
          (sva: SourceVersionAssembly) => sva.assembly_id === assembly_id
        );
        
        if (svaEntry) {
          // GTF file
          files.push({
            id: `gtf-${source.source_id}-${version.sv_id}-${assembly_id}-${nomenclature}`,
            name: `${source.name}_v${version.version_name}_${assembly_name}_${nomenclature}.gtf.gz`,
            description: `${source.name} annotations in GTF format`,
            type: 'gtf.gz',
            downloadUrl: `${API_BASE_URL}/public/source_file/${svaEntry.sva_id}/${encodeURIComponent(nomenclature)}/gtf`,
            assembly_id,
            nomenclature,
            sva_id: svaEntry.sva_id,
            file_type: 'gtf',
          });
          
          // GFF3 file
          files.push({
            id: `gff3-${source.source_id}-${version.sv_id}-${assembly_id}-${nomenclature}`,
            name: `${source.name}_v${version.version_name}_${assembly_name}_${nomenclature}.gff3`,
            description: `${source.name} annotations in GFF3 format`,
            type: 'gff3.gz',
            downloadUrl: `${API_BASE_URL}/public/source_file/${svaEntry.sva_id}/${encodeURIComponent(nomenclature)}/gff`,
            assembly_id,
            nomenclature,
            sva_id: svaEntry.sva_id,
            file_type: 'gff3',
          });
        }
      }
      
      dispatch(setDownloadsData(files));
      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch download files';
      dispatch(setDownloadsError(errorMessage));
      throw error;
    }
  }
);

export const downloadFile = createAsyncThunk(
  'downloads/downloadFile',
  async (file: DownloadFile) => {
    window.location.href = file.downloadUrl;
    return { success: true, fileName: file.name };
  }
);