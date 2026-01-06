const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface BrowserTrackProps {
  name: string;
  assembly_name: string;
  sva_id: number;
  nomenclature: string;
}

export interface TrackConfig {
  trackId: string;
  name: string;
  source_id: number;
  sv_id: number;
  sva_id: number;
  nomenclature: string;
  colorScheme: string;
}

// Color scheme definitions
const colorSchemeMap = {
  'Orange/Green/Red': {
    color1: '#ff7f0e',
    color2: '#2ca02c',
    color3: '#d62728'
  },
  'Blue/Light Red/Light Green': {
    color1: '#1f77b4',
    color2: '#ff9896',
    color3: '#98df8a'
  },
  'Purple/Orange/Teal': {
    color1: '#9467bd',
    color2: '#ff7f0e',
    color3: '#17becf'
  },
  'Brown/Pink/Gray': {
    color1: '#8c564b',
    color2: '#e377c2',
    color3: '#7f7f7f'
  },
  'Red/Blue/Green': {
    color1: '#d62728',
    color2: '#1f77b4',
    color3: '#2ca02c'
  },
  'Orange/Purple/Green': {
    color1: '#ff7f0e',
    color2: '#9467bd',
    color3: '#2ca02c'
  }
};

export const getTracks = (track: BrowserTrackProps) => {
  return [
    {
      type: 'FeatureTrack',
      trackId: 'genes',
      name: `${track.name} - Primary Track`,
      description: 'Primary GFF feature track with orange/green/red color scheme',
      assemblyNames: [track.assembly_name],
      category: ['Genes'],
      metadata: {
        source: 'Primary',
        colorScheme: 'Orange/Green/Red',
        purpose: 'Main feature visualization'
      },
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: `${API_BASE_URL}/public/gff3bgz_jbrowse2/${track.sva_id}/${track.nomenclature}`,
        },
        index: {
          location: {
            uri: `${API_BASE_URL}/public/gff3bgztbi/${track.sva_id}/${track.nomenclature}`,
          },
          indexType: 'TBI',
        },
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'genes-LinearBasicDisplay',
          // Use compact layout with minimal height
          height: 80, // Much smaller starting height
          // Configure layout to pack features tightly
          layout: {
            type: 'box',
            spacing: 2, // Minimal spacing between features
          },
          // Make features smaller to fit more in less space
          featureHeight: 8,
          // Configure renderer for compact display
          renderer: {
            type: 'SvgFeatureRenderer',
            color1: '#ff7f0e',
            color2: '#2ca02c',
            color3: '#d62728',
            // These help with feature density
            featureHeight: 8,
            spacing: 1,
          }
        }
      ]
    },
    {
      type: 'FeatureTrack',
      trackId: 'genes-duplicate',
      name: `${track.name} - Duplicate Track`,
      description: 'Duplicate GFF feature track with blue/light red/light green color scheme',
      assemblyNames: [track.assembly_name],
      category: ['Genes'],
      metadata: {
        source: 'Duplicate',
        colorScheme: 'Blue/Light Red/Light Green',
        purpose: 'Alternative feature visualization'
      },
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: `${API_BASE_URL}/public/gff3bgz_jbrowse2/${track.sva_id}/${track.nomenclature}`,
        },
        index: {
          location: {
            uri: `${API_BASE_URL}/public/gff3bgztbi/${track.sva_id}/${track.nomenclature}`,
          },
          indexType: 'TBI',
        },
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'genes-duplicate-LinearBasicDisplay',
          height: 80, // Much smaller starting height
          layout: {
            type: 'box',
            spacing: 2,
          },
          featureHeight: 8,
          renderer: {
            type: 'SvgFeatureRenderer',
            color1: '#1f77b4',
            color2: '#ff9896',
            color3: '#98df8a',
            featureHeight: 8,
            spacing: 1,
          }
        }
      ]
    }
  ];
};

// New function to generate tracks from TrackConfig objects
export const generateTracksFromConfig = (tracks: TrackConfig[], assemblyName: string) => {
  return tracks.map(track => {
    const colors = colorSchemeMap[track.colorScheme as keyof typeof colorSchemeMap] || colorSchemeMap['Orange/Green/Red'];
    
    return {
      type: 'FeatureTrack',
      trackId: track.trackId,
      name: track.name,
      description: `GFF feature track for ${track.name} with ${track.colorScheme} color scheme`,
      assemblyNames: [assemblyName],
      category: ['Genes'],
      metadata: {
        source: track.name,
        colorScheme: track.colorScheme,
        purpose: 'Feature visualization'
      },
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: `${API_BASE_URL}/public/gff3bgz_jbrowse2/${track.sva_id}/${track.nomenclature}`,
        },
        index: {
          location: {
            uri: `${API_BASE_URL}/public/gff3bgztbi/${track.sva_id}/${track.nomenclature}`,
          },
          indexType: 'TBI',
        },
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: `${track.trackId}-LinearBasicDisplay`,
          height: 80,
          layout: {
            type: 'box',
            spacing: 2,
          },
          featureHeight: 8,
          renderer: {
            type: 'SvgFeatureRenderer',
            ...colors,
            featureHeight: 8,
            spacing: 1,
          }
        }
      ]
    };
  });
};