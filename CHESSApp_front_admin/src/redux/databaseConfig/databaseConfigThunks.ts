import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setDatabaseConfig, setError } from './databaseConfigSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const fetchDatabaseConfig = createAsyncThunk(
  'databaseConfig/fetchDatabaseConfig',
  async (_, { dispatch }) => {
    dispatch(setLoading());
    try {
      const response = await fetch(`${API_BASE_URL}/admin/db_config`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch database config');
      }
      
      dispatch(setDatabaseConfig(data.data));
      return data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch database config';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
);

export const updateDatabaseConfig = createAsyncThunk(
  'databaseConfig/updateDatabaseConfig',
  async (config: { data_dir: string }, { dispatch }) => {
    dispatch(setLoading());
    try {
      const response = await fetch(`${API_BASE_URL}/admin/set_db_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update database config');
      }
      
      dispatch(setDatabaseConfig(data.data));
      return data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update database config';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
);
