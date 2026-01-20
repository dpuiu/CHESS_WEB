import React from 'react';
import { Badge, Card, Button, Alert } from 'react-bootstrap';
import { DatabaseTableInfo } from '../../types';
import { DatabaseTableDataResponse } from '../../types';
import { TableDataDisplay } from './TableDataDisplay';

interface DatabaseSectionProps {
  title: string;
  items: DatabaseTableInfo[];
  isView: boolean;
  expanded: { [table: string]: boolean };
  sectionExpanded: boolean;
  searchTerms: { [table: string]: string };
  tableData: { [tableName: string]: DatabaseTableDataResponse };
  onToggleExpand: (tableName: string) => void;
  onToggleSection: () => void;
  onSearch: (tableName: string, searchTerm: string) => void;
  onClearTable: (tableName: string) => void;
}

export const DatabaseSection: React.FC<DatabaseSectionProps> = ({
  title,
  items,
  isView,
  expanded,
  sectionExpanded,
  searchTerms,
  tableData,
  onToggleExpand,
  onToggleSection,
  onSearch,
  onClearTable,
}) => (
  <div className="mb-4">
    <div className="section-header" onClick={onToggleSection}>
      <span>
        {sectionExpanded ? '▼' : '▶'} {title}
      </span>
      <Badge bg="secondary">{items.length} items</Badge>
    </div>

    {sectionExpanded && (
      <div className="section-content">
        {items.length === 0 ? (
          <div className="empty-section">
            No {isView ? 'views' : 'tables'} found.
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.name} className="table-item">
              <div className="table-header">
                <div>
                  <span
                    onClick={() => onToggleExpand(item.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {expanded[item.name] ? '▼' : '▶'} {item.name}
                  </span>
                  {item.description && (
                    <div className="table-description">
                      {item.description}
                    </div>
                  )}
                </div>
                {!isView && (
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearTable(item.name);
                    }}
                  >
                    Clear Table
                  </Button>
                )}
              </div>

              {expanded[item.name] && (
                <div className="table-content">
                  {item.error ? (
                    <Alert variant="danger">Error: {item.error}</Alert>
                  ) : (
                    <TableDataDisplay
                      tableName={item.name}
                      searchTerm={searchTerms[item.name] || ''}
                      onSearch={(searchTerm) => onSearch(item.name, searchTerm)}
                      data={tableData[item.name]}
                    />
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    )}
  </div>
);