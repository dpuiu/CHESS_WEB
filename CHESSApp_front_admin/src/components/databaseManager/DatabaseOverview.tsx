import React from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { DatabaseSection } from './index';
import { DatabaseListResponse, DatabaseTableDataResponse } from '../../types';

interface DatabaseOverviewProps {
  databaseList: DatabaseListResponse | null;
  tableData: { [tableName: string]: DatabaseTableDataResponse };
  loading: boolean;
  error: string | null;
  expanded: { [table: string]: boolean };
  sectionsExpanded: { tables: boolean; views: boolean };
  searchTerms: { [table: string]: string };
  onToggleExpand: (tableName: string) => void;
  onToggleSection: (section: 'tables' | 'views') => void;
  onSearch: (tableName: string, searchTerm: string) => void;
  onClearTable: (tableName: string) => void;
}

export const DatabaseOverview: React.FC<DatabaseOverviewProps> = ({
  databaseList,
  tableData,
  loading,
  error,
  expanded,
  sectionsExpanded,
  searchTerms,
  onToggleExpand,
  onToggleSection,
  onSearch,
  onClearTable,
}) => {
  if (loading && !databaseList) {
    return (
      <div className="text-center">
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

  return (
    <div>
      <h3 className="mt-4">Database Overview</h3>

      <DatabaseSection
        title="Tables"
        items={databaseList.tables}
        isView={false}
        expanded={expanded}
        sectionExpanded={sectionsExpanded.tables}
        searchTerms={searchTerms}
        tableData={tableData}
        onToggleExpand={onToggleExpand}
        onToggleSection={() => onToggleSection('tables')}
        onSearch={onSearch}
        onClearTable={onClearTable}
      />

      <DatabaseSection
        title="Views"
        items={databaseList.views}
        isView={true}
        expanded={expanded}
        sectionExpanded={sectionsExpanded.views}
        searchTerms={searchTerms}
        tableData={tableData}
        onToggleExpand={onToggleExpand}
        onToggleSection={() => onToggleSection('views')}
        onSearch={onSearch}
        onClearTable={onClearTable}
      />
    </div>
  );
};