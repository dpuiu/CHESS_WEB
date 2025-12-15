import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { UrlParams, AppSettings } from '../../types/appTypes';
import { validateSelections } from '../../utils/validationUtils';

// Initialize app selections from URL parameters
export const initializeAppSelections = createAsyncThunk<
  AppSettings,     // Return type - validated selections
  UrlParams,           // Input type - raw URL params
  { state: RootState }
>(
  'appData/initializeAppSelections',
  async (urlParams, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { organisms, assemblies, sources } = state.dbData;
      
      const selections = parseUrlToSelections(urlParams, { organisms, assemblies, sources });
      
      // Validate selections and throw error if invalid
      if (!validateSelections(selections, state.dbData)) {
        throw new Error('Invalid configuration parameters');
      }
      
      return selections;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize');
    }
  }
);

function parseUrlToSelections(
  params: UrlParams, 
  dbData: { organisms: any; assemblies: any; sources: any }
): AppSettings {
  const { organism, assembly, source, version, nomenclature } = params;
  
  if (!organism || !assembly || !source || !version || !nomenclature) {
    throw new Error('Missing required URL parameters');
  }

  const organismEntry = dbData.organisms[organism];
  if (!organismEntry) throw new Error(`Organism "${organism}" not found`);
  
  const assemblyEntry = dbData.assemblies[assembly];
  if (!assemblyEntry) throw new Error(`Assembly "${assembly}" not found`);
  
  const sourceEntry = dbData.sources[source];
  if (!sourceEntry) throw new Error(`Source "${source}" not found`);
  
  const versionEntry = sourceEntry.versions?.[version];
  if (!versionEntry) throw new Error(`Version "${version}" not found in source "${source}"`);
  
  const svaEntry = versionEntry.assemblies?.[assembly];
  if (!svaEntry) throw new Error(`Assembly "${assembly}" not available in source "${source}" version "${version}"`);
  
  return {
    organism_id: organismEntry.taxonomy_id,
    assembly_id: assemblyEntry.assembly_id,
    source_id: sourceEntry.source_id,
    version_id: versionEntry.sv_id,
    nomenclature
  };
}

