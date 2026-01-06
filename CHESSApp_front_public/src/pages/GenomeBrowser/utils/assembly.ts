const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export interface BrowserAssemblyProps {
  name: string;
  assembly_name: string;
  assembly_id: number;
  nomenclature: string;
}
export const getAssembly = (assembly: BrowserAssemblyProps) => {
  return {
    name: `${assembly.name}`,
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: `ReferenceSequenceTrack`,
      adapter: {
        type: 'IndexedFastaAdapter',
        fastaLocation: {
          uri: `${API_BASE_URL}/public/fasta/${assembly.assembly_id}/${assembly.nomenclature}`,
          locationType: 'UriLocation',
        },
        faiLocation: {
          uri: `${API_BASE_URL}/public/fai/${assembly.assembly_id}/${assembly.nomenclature}`,
          locationType: 'UriLocation',
        },
      },
    },
  };
};