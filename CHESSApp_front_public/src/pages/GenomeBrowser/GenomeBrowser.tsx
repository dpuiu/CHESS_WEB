import React, { useRef, useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Card } from 'react-bootstrap';
import { useDbData, useAppData } from '../../hooks';
import { useParams } from 'react-router-dom';
import { JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { createViewState } from '@jbrowse/react-linear-genome-view';
import TrackManager from './utils/TrackManager';
import { TrackConfig } from './utils/tracks';
import { getAssembly, type BrowserAssemblyProps } from './utils/assembly';
import { generateTracksFromConfig } from './utils/tracks';
import { generateSessionWithTracks } from './utils/defaultSession';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

import { Region } from '@jbrowse/core/util'

const GenomeBrowser: React.FC = () => {
  // parse the locus from the url
  const { locus } = useParams<{ locus?: string }>();

  const dbDataHook = useDbData();
  const dbData = dbDataHook.getDbData();

  const appDataHook = useAppData();
  const appData = appDataHook.getAppData();

  const organism = appData.selections.organism_id 
    ? dbDataHook.getOrganism(appData.selections.organism_id)
    : undefined;
  const assembly = appData.selections.assembly_id 
    ? dbDataHook.getAssembly(appData.selections.assembly_id)
    : undefined;
  const source = appData.selections.source_id 
    ? dbDataHook.getSource(appData.selections.source_id)
    : undefined;
  const version = appData.selections.version_id && appData.selections.source_id
    ? dbDataHook.getSourceVersion(appData.selections.source_id, appData.selections.version_id)
    : undefined;
  const sva = appData.selections.source_id && appData.selections.version_id && appData.selections.assembly_id
    ? dbDataHook.getSourceVersionAssembly_byID(appData.selections.source_id, appData.selections.version_id, appData.selections.assembly_id)
    : undefined;
  const nomenclature = appData.selections.nomenclature;

  const [currentTracks, setCurrentTracks] = useState<TrackConfig[]>([]);
  const [viewState, setViewState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLocation, setSavedLocation] = useState<string | null>(locus || null);
  
  // Keep track of previous selections to detect changes
  const previousSelections = useRef<{
    organism_id: number;
    assembly_id: number;
    source_id: number;
    version_id: number;
    nomenclature: string;
  } | null>(null);

  const handleTracksChange = (newTracks: TrackConfig[]) => {
    setCurrentTracks(newTracks);
  };

  // Save initialLocation when it changes
  useEffect(() => {
    if (locus) {
      setSavedLocation(locus);
    }
  }, [locus]);

  // Effect to handle appData changes and reset tracks
  useEffect(() => {
    if (!organism || !assembly || !source || !version || !sva || !nomenclature) {
      return;
    }

    // check if assembly has changed - if so - needs a complete reset
    if (assembly.assembly_id !== previousSelections.current?.assembly_id) {
      previousSelections.current = {
        organism_id: organism.taxonomy_id,
        assembly_id: assembly.assembly_id,
        source_id: source.source_id,
        version_id: version.sv_id,
        nomenclature: nomenclature
      };

      // Reset view state to force complete reinitialization
      setViewState(null);

      const defaultTrack: TrackConfig = {
        trackId: `track-${source.source_id}-${version.sv_id}`,
        name: `${source.name} - ${version.version_name}`,
        source_id: source.source_id,
        sv_id: version.sv_id,
        sva_id: sva.sva_id,
        nomenclature: nomenclature,
        colorScheme: 'Orange/Green/Red'
      };

      handleTracksChange([defaultTrack]);
      return;
    }
  }, [organism, assembly, source, version, sva, nomenclature]);

  // Separate effect for browser initialization when tracks change
  useEffect(() => {
    if (!organism || !assembly || !source || !version || !sva || !nomenclature) {
      return;
    }

    if (currentTracks.length === 0) {
      return;
    }

    // Always reinitialize when tracks change
    initializeBrowser();
  }, [currentTracks, organism, assembly, source, version, sva, nomenclature]);

  function loc(r: Region) {
    return `${r.refName}:${Math.floor(r.start)}-${Math.floor(r.end)}`
  }

  const initializeBrowser = () => {
    setLoading(true);
    setError(null);

    console.log('currentTracks in initializeBrowser', currentTracks);

    try {
      const assemblyProps: BrowserAssemblyProps = {
        name: assembly?.assembly_name || '',
        assembly_name: assembly?.assembly_name || '',
        assembly_id: assembly?.assembly_id || 0,
        nomenclature: nomenclature || ''
      };

      const tracksConfig = generateTracksFromConfig(currentTracks, assembly?.assembly_name || '');
      const defaultSession = generateSessionWithTracks(tracksConfig.map(track => track.trackId));

      let locationToUse = savedLocation;
      
      // If we have an existing view state, extract the current visible region
      if (viewState && viewState.session && viewState.session.views && viewState.session.views.length > 0) {
        try {
          const currentView = viewState.session.views[0];
          if (currentView && currentView.coarseDynamicBlocks) {
            const visibleRegion = currentView.coarseDynamicBlocks.map(loc).join(',');
            if (visibleRegion) {
              locationToUse = visibleRegion;
              console.log('Using current visible region:', locationToUse);
            }
          }
        } catch (regionError) {
          console.warn('Failed to extract current region, using saved location:', regionError);
        }
      }

      const state = createViewState({
        assembly: getAssembly(assemblyProps),
        tracks: tracksConfig,
        location: locationToUse || '',
        defaultSession,
        onChange: () => {},
        configuration: {
          theme: {
            palette: {
              primary: { main: '#1976d2' },
              secondary: { main: '#dc004e' },
            },
          },
        },
      });

      setViewState(state);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load genome browser');
      setLoading(false);
    }
  };

  const renderGenomeBrowser = () => {
    if (loading) {
      return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <LoadingSpinner />
        </Container>
      );
    }

    if (error) {
      return (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Genome Browser</Alert.Heading>
          <p>{error}</p>
        </Alert>
      );
    }

    if (!viewState) {
      return (
        <Alert variant="info">
          <Alert.Heading>No Data Available</Alert.Heading>
          <p>Please select an organism, assembly, source, and version to view the genome browser.</p>
        </Alert>
      );
    }

    return (
      <Card>
        <Card.Body className="p-0">
          <JBrowseLinearGenomeView
            viewState={viewState}
          />
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="py-5">
      <Row>
        <Col xs={12} md={3} lg={3} className="mb-4 mb-md-0">
          <Sidebar title="Available Tracks">
            <TrackManager
              currentTracks={currentTracks}
              onTracksChange={handleTracksChange}
              currentAssembly={assembly?.assembly_id || 0}
              currentNomenclature={appData.selections.nomenclature || ''}
            />
          </Sidebar>
        </Col>
        <Col xs={12} md={9} lg={9}>
          {dbData.loading ? (
            <Alert variant="info">
              <Alert.Heading>Loading Data</Alert.Heading>
              <Container className="d-flex justify-content-center py-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </Container>
              <p>Please wait while we load the genome data...</p>
            </Alert>
          ) : dbData.error ? (
            <Alert variant="danger">
              <Alert.Heading>Error Loading Data</Alert.Heading>
              <p>{dbData.error}</p>
            </Alert>
          ) : !organism || !assembly ? (
            <Alert variant="warning">
              <Alert.Heading>No Genome Selected</Alert.Heading>
              <p>Please select an organism and assembly using the dropdown in the header.</p>
            </Alert>
          ) : (
            renderGenomeBrowser()
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default GenomeBrowser;