import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setPrimaryLoading,
  setSecondaryLoading,
  setPrimaryTranscriptData,
  setSecondaryTranscriptData,
  setPrimaryError,
  setSecondaryError
} from './cmpTranscriptSlice';
import { TranscriptResponse } from '../../types/geneTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface FetchTranscriptParams {
  tid: number;
  transcript_id: string;
  sva_id: number;
  assembly_id: number;
  nomenclature: string;
  isSecondary?: boolean;
}

export const fetchTranscriptData = createAsyncThunk(
  'transcript/fetchTranscriptData',
  async ({ tid, transcript_id, sva_id, assembly_id, nomenclature, isSecondary = false }: FetchTranscriptParams, { dispatch }) => {
    if (isSecondary) {
      dispatch(setSecondaryLoading());
    } else {
      dispatch(setPrimaryLoading());
    }

    try {
      const response = await fetch(`${API_BASE_URL}/public/transcript_data?tid=${tid}&transcript_id=${transcript_id}&sva_id=${sva_id}&assembly_id=${assembly_id}&nomenclature=${nomenclature}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TranscriptResponse = await response.json();

      if (data.success) {
        if (isSecondary) {
          dispatch(setSecondaryTranscriptData(data.data));
        } else {
          dispatch(setPrimaryTranscriptData(data.data));
        }
        return data.data;
      } else {
        const errorMessage = data.message || `Failed to fetch transcript data`;
        if (isSecondary) {
          dispatch(setSecondaryError(errorMessage));
        } else {
          dispatch(setPrimaryError(errorMessage));
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch transcript data`;
      if (isSecondary) {
        dispatch(setSecondaryError(errorMessage));
      } else {
        dispatch(setPrimaryError(errorMessage));
      }
      throw error;
    }
  }
);