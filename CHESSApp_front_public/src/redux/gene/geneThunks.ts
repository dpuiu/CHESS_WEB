import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setGeneData, setError } from './geneSlice';
import { GeneResponse } from '../../types/geneTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const fetchGeneByGid = createAsyncThunk(
  'gene/fetchGeneByGid',
  async (gid: number, { dispatch }) => {
    dispatch(setLoading());
    try {
      const response = await fetch(`${API_BASE_URL}/public/gene/${gid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: GeneResponse = await response.json();
      
      if (data.success) {
        dispatch(setGeneData(data.data));
        return data.data;
      } else {
        const errorMessage = data.message || 'Failed to fetch gene data';
        dispatch(setError(errorMessage));
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch gene data';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
); 