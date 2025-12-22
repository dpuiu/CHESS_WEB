import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setGlobalData, setError } from './globalDataSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';

export const fetchGlobalData = createAsyncThunk(
  'globalData/fetchGlobalData',
  async (_, { dispatch }) => {
    dispatch(setLoading());
    try {
      const response = await fetch(`${API_BASE_URL}/public/globalData`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const globalData = {
        organisms: data.organisms || {},
        assemblies: data.assemblies || {},
        sources: data.sources || {},
        configurations: data.configurations || {},
        datasets: data.datasets || {
          data_types: {},
          datasets: {},
        },
      };
      
      dispatch(setGlobalData(globalData));
      return globalData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch global data';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
); 