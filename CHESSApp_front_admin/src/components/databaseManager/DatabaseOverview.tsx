import React, { useState } from 'react';
import { Row, Col, Alert, Spinner, ListGroup, Card, Form } from 'react-bootstrap';
import { DatabaseListResponse, DatabaseTableDataResponse, DatabaseTableInfo } from '../../types';
import { TableDataDisplay } from './TableDataDisplay';

interface DatabaseOverviewProps {
  databaseList: DatabaseListResponse | null;
  tableData: { [tableName: string]: DatabaseTableDataResponse };
  loading: boolean;
  error: string | null;
  selectedTable: string | null;
  searchTerms: { [table: string]: string };
  onSelectTable: (tableName: string) => void;
  onSearch: (tableName: string, searchTerm: string) => void;
  onClearTable: (tableName: string) => void;
}

export const DatabaseOverview: React.FC<DatabaseOverviewProps> = ({
  databaseList,
  tableData,
  loading,
  error,
  selectedTable,
  searchTerms,
  onSelectTable,
  onSearch,
  onClearTable,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading && !databaseList) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading database overview...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Error: {error}</Alert>;
  }

  if (!databaseList) {
    return <Alert variant="warning">No database information available</Alert>;
  }

  const { tables, views } = databaseList;

  // Filter tables/views based on sidebar search
  const filterItems = (items: DatabaseTableInfo[]) => {
    if (!searchTerm) return items;
    return items.filter((item: DatabaseTableInfo) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTables = filterItems(tables);
  const filteredViews = filterItems(views);

  const selectedItem = selectedTable
    ? (tables.find((t: DatabaseTableInfo) => t.name === selectedTable) ||
      views.find((v: DatabaseTableInfo) => v.name === selectedTable))
    : null;

  const isSelectedTable = selectedItem ? tables.some((t: DatabaseTableInfo) => t.name === selectedItem.name) : false;

  return (
    <div className="mt-4">
      <Row>
        {/* Sidebar - Table List */}
        <Col md={3} className="border-end pe-0">
          <div className="p-3 bg-light border-bottom">
            <h5 className="mb-3">Tables & Views</h5>
            <Form.Control
              type="text"
              placeholder="Filter list..."
              size="sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>

          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {/* Tables Section */}
            {filteredTables.length > 0 && (
              <div className="p-2">
                <small className="text-muted fw-bold text-uppercase px-2 mb-2 d-block">
                  Tables
                </small>
                <ListGroup variant="flush" className="mb-3">
                  {filteredTables.map((table) => (
                    <ListGroup.Item
                      key={table.name}
                      action
                      active={selectedTable === table.name}
                      onClick={() => onSelectTable(table.name)}
                      className="border-0 rounded mb-1 py-2"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-truncate" title={table.name}>
                          {table.name}
                        </span>
                        {table.error && (
                          <i className="fas fa-exclamation-circle text-danger" title={table.error} />
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Views Section */}
            {filteredViews.length > 0 && (
              <div className="p-2">
                <small className="text-muted fw-bold text-uppercase px-2 mb-2 d-block">
                  Views
                </small>
                <ListGroup variant="flush">
                  {filteredViews.map((view) => (
                    <ListGroup.Item
                      key={view.name}
                      action
                      active={selectedTable === view.name}
                      onClick={() => onSelectTable(view.name)}
                      className="border-0 rounded mb-1 py-2"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-truncate" title={view.name}>
                          {view.name}
                        </span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {filteredTables.length === 0 && filteredViews.length === 0 && (
              <div className="text-center p-4 text-muted">
                No matches found
              </div>
            )}
          </div>
        </Col>

        {/* Main Content - Data Display */}
        <Col md={9} className="ps-0">
          <div className="p-3 h-100">
            {selectedTable ? (
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-primary">
                      <i className="fas fa-table me-2" />
                      {selectedTable}
                    </h5>
                    {isSelectedTable && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onClearTable(selectedTable)}
                        title="Clear all data from this table"
                      >
                        <i className="fas fa-trash-alt me-1" />
                        Clear Table
                      </button>
                    )}
                  </div>
                  {/* Description if available */}
                  {selectedItem?.description && (
                    <p className="text-muted small mb-0 mt-2">
                      {selectedItem.description}
                    </p>
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="p-3">
                    <TableDataDisplay
                      tableName={selectedTable}
                      searchTerm={searchTerms[selectedTable] || ''}
                      onSearch={(term) => onSearch(selectedTable, term)}
                      data={tableData[selectedTable]}
                    />
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-5" style={{ minHeight: '400px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <i className="fas fa-table fa-4x mb-3 text-secondary" style={{ opacity: 0.3 }} />
                <h5>Select a table or view</h5>
                <p>Choose an item from the list on the left to view its data schema and contents.</p>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};