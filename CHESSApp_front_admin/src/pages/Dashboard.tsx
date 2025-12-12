import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card,
  Spinner, 
  Alert 
} from 'react-bootstrap';
import { RootState } from '../redux/store';
import { StatsCard } from '../components/dashboard/StatsCard';
import { QuickActionButton } from '../components/dashboard/QuickActionButton';

const Dashboard: React.FC = () => {
  const { sources, assemblies, organisms, configurations, datasets, loading, error } = useSelector(
    (state: RootState) => state.globalData
  );
  const { data_dir, loading: databaseConfigLoading, error: databaseConfigError } = useSelector(
    (state: RootState) => state.databaseConfig
  );
  const navigate = useNavigate();

  const navigateToSection = (section: string) => {
    navigate(`/${section}`);
  };

  const isDatabaseConfigured = data_dir && data_dir.trim() !== '';
  const hasData = sources && assemblies && organisms && configurations && datasets;
  const stats = hasData ? {
    organisms: Object.keys(organisms).length,
    assemblies: Object.keys(assemblies).length,
    sources: Object.keys(sources).length,
    configurations: Object.keys(configurations).length,
  } : null;

  const actions = [
    { icon: 'fas fa-database', label: 'Manage Database', section: 'database', variant: 'primary' },
    { icon: 'fas fa-dna', label: 'Manage Organisms', section: 'organisms', variant: 'primary' },
    { icon: 'fas fa-layer-group', label: 'Manage Assemblies', section: 'assemblies', variant: 'success' },
    { icon: 'fas fa-tags', label: 'Manage Sources', section: 'sources', variant: 'warning' },
    { icon: 'fas fa-cogs', label: 'Manage Configurations', section: 'configurations', variant: 'secondary' },
    { icon: 'fas fa-chart-bar', label: 'Manage Datasets', section: 'datasets', variant: 'info' },
  ];

  const renderStats = () => {
    if (loading || databaseConfigLoading) {
      return (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (error || databaseConfigError) {
      return (
        <Alert variant="danger">
          Error loading data: {error || databaseConfigError}
        </Alert>
      );
    }

    if (!isDatabaseConfigured) {
      return (
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2" />
          <strong>Database Configuration Required</strong>
          <br />
          Please configure the database settings before accessing the dashboard. 
          Go to <a href="/database" className="alert-link">Database Management</a> to set up the data directory.
        </Alert>
      );
    }

    if (!hasData) {
      return (
        <Alert variant="warning">
          Unable to load database statistics
        </Alert>
      );
    }

    return (
      <Row>
        <StatsCard 
          count={isDatabaseConfigured ? 1 : 0} 
          label="Database Config" 
          variant={isDatabaseConfigured ? "success" : "danger"}
          icon="fas fa-cog"
        />
        <StatsCard count={stats!.organisms} label="Organisms" variant="primary" />
        <StatsCard count={stats!.assemblies} label="Assemblies" variant="success" />
        <StatsCard count={stats!.sources} label="Sources" variant="secondary" />
        <StatsCard count={stats!.configurations} label="Configurations" variant="info" />
      </Row>
    );
  };

  return (
    <Container fluid>
      <Row>
        <Col xs={12} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-database me-2" />
                Database Overview
              </h5>
            </Card.Header>
            <Card.Body>
              {databaseConfigLoading && <div>Loading...</div>}
              {renderStats()}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2" />
                Actions
              </h5>
            </Card.Header>
            <Card.Body>
              {!isDatabaseConfigured ? (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-info-circle me-2" />
                  Please configure the database settings to access management features.
                </Alert>
              ) : (
                <Row>
                  {actions.map((action) => (
                    <QuickActionButton
                      key={action.section}
                      icon={action.icon}
                      label={action.label}
                      section={action.section}
                      variant={action.variant}
                      onClick={navigateToSection}
                    />
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;