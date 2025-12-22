import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DownloadsState, DownloadFile } from '../../types/downloadsTypes';

const initialState: DownloadsState = {
  files: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const downloadsSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    setDownloadsLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setDownloadsData(state, action: PayloadAction<DownloadFile[]>) {
      state.files = action.payload;
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setDownloadsError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearDownloads(state) {
      state.files = [];
      state.lastUpdated = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { 
  setDownloadsLoading, 
  setDownloadsData, 
  setDownloadsError, 
  clearDownloads 
} = downloadsSlice.actions;

export default downloadsSlice.reducer; 