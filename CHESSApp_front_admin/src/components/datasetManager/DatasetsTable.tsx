import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { Dataset } from '../../types';

interface DatasetsTableProps {
  datasets: Dataset[];
  onEdit: (dataset: Dataset) => void;
  onDelete: (datasetId: number) => void;
  loading?: boolean;
}

export const DatasetsTable: React.FC<DatasetsTableProps> = ({
  datasets,
  onEdit,
  onDelete,
  loading = false
}) => {


  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No datasets found. Create your first dataset to get started.</p>
      </div>
    );
  }

  return (
    <Table responsive striped hover className="datasets-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Data Type</th>
          <th>Data Target</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) => (
          <tr key={dataset.dataset_id}>
            <td>
              <strong>{dataset.name}</strong>
            </td>
            <td>
              <div className="text-truncate" style={{ maxWidth: '300px' }} title={dataset.description}>
                {dataset.description}
              </div>
            </td>
            <td>{dataset.data_type}</td>
            <td>
              <Badge 
                bg={dataset.data_target === 'genes' ? 'success' : 'info'}
              >
                {dataset.data_target === 'genes' ? 'Genes' : 'Transcripts'}
              </Badge>
            </td>
            <td>
              <div className="btn-group" role="group">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onEdit(dataset)}
                  title="Edit Dataset"
                >
                  <i className="fas fa-edit"></i>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onDelete(dataset.dataset_id)}
                  title="Delete Dataset"
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}; 