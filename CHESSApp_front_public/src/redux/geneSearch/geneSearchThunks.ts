import { createAsyncThunk } from '@reduxjs/toolkit';
import { GeneSearchResponse, GeneSearchParams } from '../../types/geneTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const searchGenes = createAsyncThunk(
  'geneSearch/searchGenes',
  async (params: GeneSearchParams): Promise<GeneSearchResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('sva_id', params.sva_id.toString());
    
    // Clean parameter building
    const paramMap = {
      q: params.search_term,
      gene_type: params.gene_type,
      page: params.page?.toString(),
      per_page: params.per_page?.toString(),
      sort: params.sort_by,
      order: params.sort_order
    };

    Object.entries(paramMap).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/public/genes/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data: GeneSearchResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Search failed');
    }
    
    return data;
  }
);