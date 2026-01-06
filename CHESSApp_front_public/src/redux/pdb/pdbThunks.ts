import { createAsyncThunk } from '@reduxjs/toolkit';
import { setPDBLoading, setPDBData, setPDBError, setPDBDownloading } from './pdbSlice';
import { PDBData } from '../../types/pdbTypes';

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
        dispatch(setPDBData({ td_id, data: data.data }));
        return data.data;
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
  async (td_id: number, { dispatch }) => {
    dispatch(setPDBDownloading({ td_id, downloading: true }));
    
    try {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/public/pdb_download/${td_id}`;
      link.target = '_blank';
      
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