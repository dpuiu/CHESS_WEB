import React from 'react';
import { Form, Table } from 'react-bootstrap';
import { DatabaseTableDataResponse } from '../../types';

interface TableDataDisplayProps {
  tableName: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  data?: DatabaseTableDataResponse;
}

export const TableDataDisplay: React.FC<TableDataDisplayProps> = ({
  tableName,
  searchTerm,
  onSearch,
  data
}) => {
  if (!data) {
    return <div>Loading table data...</div>;
  }

  return (
    <div>
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search in table..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        {data.search_term && (
          <span className="search-filter">
            Filtered by: "{data.search_term}"
          </span>
        )}
      </div>

      <div className="fw-bold">Schema:</div>
      <div className="schema-display">
        {data.data.columns && data.data.columns.join(', ')}
      </div>

      <div className="fw-bold">Data (showing {data.data.rows?.length || 0} rows):</div>
      <Table className="data-table">
        <thead>
          <tr>
            {data.data.columns && data.data.columns.map((col: string) => (
              <th key={col}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.rows && data.data.rows.length === 0 && (
            <tr>
              <td colSpan={data.data.columns.length} className="empty-data">
                {searchTerm ? 'No data matching search criteria' : 'No data'}
              </td>
            </tr>
          )}
          {data.data.rows && data.data.rows.map((row: any, i: number) => (
            <tr key={i}>
              {row.map((cell: any, j: number) => (
                <td key={j}>
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}; 