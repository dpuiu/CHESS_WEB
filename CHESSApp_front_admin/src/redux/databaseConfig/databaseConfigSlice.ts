import { createSlice } from '@reduxjs/toolkit';

export interface DatabaseConfigState {
  data_dir: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DatabaseConfigState = {
  data_dir: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const databaseConfigSlice = createSlice({
  name: 'databaseConfig',
  initialState,
  reducers: {
    setLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setDatabaseConfig(state, action) {
      // Handle both string and object payloads
      const payload = action.payload;
      if (typeof payload === 'string') {
        state.data_dir = payload;
      } else if (payload && typeof payload === 'object') {
        state.data_dir = payload.data_dir;
      }
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    clearDatabaseConfig(state) {
      state.data_dir = null;
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const { setLoading, setDatabaseConfig, setError, clearDatabaseConfig } = databaseConfigSlice.actions;
export default databaseConfigSlice.reducer;
