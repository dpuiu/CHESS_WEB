import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useCreateDatasetMutation,
  useUpdateDatasetMutation,
  useDeleteDatasetMutation,
  useCreateDataTypeMutation,
  useUpdateDataTypeMutation,
  useDeleteDataTypeMutation
} from '../redux/api/apiSlice';
import { Dataset, DataType } from '../types';
import { DatasetForm, DatasetsTable, DataTypeForm, DataTypesTable } from '../components/datasetManager';
import './DatasetsManagement.css';

const DatasetsManagement: React.FC = () => {
  // RTK Query Hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [createDataset] = useCreateDatasetMutation();
  const [updateDataset] = useUpdateDatasetMutation();
  const [deleteDataset] = useDeleteDatasetMutation();
  const [createDataType] = useCreateDataTypeMutation();
  const [updateDataType] = useUpdateDataTypeMutation();
  const [deleteDataType] = useDeleteDataTypeMutation();

  const datasetsData = globalData?.datasets || { datasets: {}, data_types: {} };
  const datasets = datasetsData.datasets || {};
  const data_types = datasetsData.data_types || {};

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Data type management state
  const [showDataTypeForm, setShowDataTypeForm] = useState(false);
  const [editingDataType, setEditingDataType] = useState<DataType | null>(null);

  const handleAddDataset = async (datasetData: Partial<Dataset> & { file?: File; sva_id: number }) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await createDataset(datasetData).unwrap();
      setFormSuccess('Dataset created successfully');
      setShowAddForm(false);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to create dataset');
    }
  };

  const handleEditDataset = async (id: number, datasetData: Partial<Dataset>) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await updateDataset({ datasetId: id, datasetData }).unwrap();
      setFormSuccess('Dataset updated successfully');
      setEditingDataset(null);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to update dataset');
    }
  };

  const handleDeleteDataset = async (datasetId: number) => {
    if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await deleteDataset(datasetId).unwrap();
      setFormSuccess('Dataset deleted successfully');
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to delete dataset');
    }
  };

  // Data type management functions
  const handleAddDataType = async (dataTypeData: { data_type: string; description: string }) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await createDataType(dataTypeData).unwrap();
      setFormSuccess('Data type created successfully');
      setShowDataTypeForm(false);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to create data type');
    }
  };

  const handleEditDataType = async (dataType: string, dataTypeData: Partial<DataType>) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await updateDataType({ dataType, dataTypeData }).unwrap();
      setFormSuccess('Data type updated successfully');
      setEditingDataType(null);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to update data type');
    }
  };

  const handleDeleteDataType = async (dataType: string) => {
    if (!window.confirm('Are you sure you want to delete this data type? This action cannot be undone.')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await deleteDataType(dataType).unwrap();
      setFormSuccess('Data type deleted successfully');
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to delete data type');
    }
  };

  return (
    <Container fluid className="datasets-management">
      <Row>
        <Col>
          <div className="datasets-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="datasets-title">Datasets Management</h2>
                <p className="datasets-subtitle">Manage transcript and gene datasets and upload data</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {globalError && (
        <Alert variant="danger">
          {'status' in (globalError as any) ? `Error loading data (${(globalError as any).status})` : 'Failed to load data'}
        </Alert>
      )}

      {formError && (
        <Alert variant="danger" onClose={() => setFormError(null)} dismissible>
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert variant="success" onClose={() => setFormSuccess(null)} dismissible>
          {formSuccess}
        </Alert>
      )}

      {/* Data Types Management Section */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-tags me-2" />
                  Data Types ({Object.keys(data_types || {}).length})
                </h5>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowDataTypeForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add New Data Type
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <DataTypesTable
                dataTypes={Object.values(data_types || {})}
                onEdit={setEditingDataType}
                onDelete={handleDeleteDataType}
                loading={globalLoading}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2" />
                  Datasets ({Object.keys(datasets).length})
                </h5>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add New Dataset
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <DatasetsTable
                datasets={Object.values(datasets)}
                onEdit={setEditingDataset}
                onDelete={handleDeleteDataset}
                loading={globalLoading}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <DatasetForm
        show={showAddForm}
        onHide={() => setShowAddForm(false)}
        onSubmit={handleAddDataset}
        loading={false}
      />

      <DatasetForm
        show={!!editingDataset}
        onHide={() => setEditingDataset(null)}
        onSubmit={(data) => handleEditDataset(editingDataset!.dataset_id, data)}
        dataset={editingDataset}
        loading={false}
      />

      {/* Data Type Form Modals */}
      <DataTypeForm
        show={showDataTypeForm}
        onHide={() => setShowDataTypeForm(false)}
        onSubmit={handleAddDataType}
        loading={false}
      />

      <DataTypeForm
        show={!!editingDataType}
        onHide={() => setEditingDataType(null)}
        onSubmit={(data) => handleEditDataType(editingDataType!.data_type, data)}
        dataType={editingDataType}
        loading={false}
      />
    </Container>
  );
};

export default DatasetsManagement;