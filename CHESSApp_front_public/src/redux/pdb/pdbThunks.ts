import { createAsyncThunk } from '@reduxjs/toolkit';
import { setPDBLoading, setPDBData, setPDBError, setPDBDownloading } from './pdbSlice';
import { PDBData } from '../../types/pdbTypes';
import { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface PDBResponse {
  success: boolean;
  data: PDBData;
  message?: string;
}

export const fetchPDBByTdId = createAsyncThunk(
  'pdb/fetchPDBByTdId',
  async (td_id: number, { dispatch }) => {
    dispatch(setPDBLoading({ td_id, loading: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/public/pdb/${td_id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PDBResponse = await response.json();

      if (data.success) {
        let pdbData = data.data;

        // If a URL is provided (e.g., GCS URL), fetch the content from there
        if (pdbData.url && (!pdbData.pdb_content || pdbData.pdb_content === '')) {
          try {
            const contentResponse = await fetch(pdbData.url);
            if (!contentResponse.ok) {
              throw new Error(`Failed to fetch PDB content from URL: ${contentResponse.status}`);
            }
            const contentText = await contentResponse.text();
            pdbData = { ...pdbData, pdb_content: contentText };
          } catch (urlError) {
            console.error("Error fetching PDB content from URL:", urlError);
            throw new Error(`Failed to load PDB file from storage: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
          }
        }

        dispatch(setPDBData({ td_id, data: pdbData }));
        return pdbData;
      } else {
        throw new Error(data.message || 'Failed to fetch PDB data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch PDB data';
      dispatch(setPDBError({ td_id, error: errorMessage }));
      throw error;
    }
  }
);

export const downloadPDBFile = createAsyncThunk(
  'pdb/downloadPDBFile',
  async (td_id: number, { dispatch, getState }) => {
    dispatch(setPDBDownloading({ td_id, downloading: true }));

    try {
      // Check if we already have the URL in the state
      const state = getState() as RootState;
      const existingData = state.pdb?.pdbData?.[td_id];
      let downloadUrl = '';

      if (existingData?.url) {
        downloadUrl = existingData.url;
      } else {
        // If not in state, fetch the metadata to get the URL
        const response = await fetch(`${API_BASE_URL}/public/pdb/${td_id}`);
        if (!response.ok) throw new Error('Failed to fetch PDB info');
        const data: PDBResponse = await response.json();
        if (data.success && data.data.url) {
          downloadUrl = data.data.url;
        } else {
          // Fallback to old backend download route
          downloadUrl = `${API_BASE_URL}/public/pdb_download/${td_id}`;
        }
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = `structure_${td_id}.pdb`; // Suggest a filename

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(setPDBDownloading({ td_id, downloading: false }));
      return { success: true, td_id };
    } catch (error) {
      dispatch(setPDBDownloading({ td_id, downloading: false }));
      throw new Error(error instanceof Error ? error.message : 'Failed to download PDB file');
    }
  }
);