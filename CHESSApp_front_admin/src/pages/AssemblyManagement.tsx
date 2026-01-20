import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useAddAssemblyMutation,
  useUpdateAssemblyMutation,
  useDeleteAssemblyMutation
} from '../redux/api/apiSlice';
import AssemblyForm from '../components/assemblyManager/AssemblyForm';
import AssemblyTable from '../components/assemblyManager/AssemblyTable';
import { Assembly, Organism } from '../types';

const AssemblyManagement: React.FC = () => {
  const navigate = useNavigate();

  // RTK Query hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [addAssembly, { isLoading: isAdding }] = useAddAssemblyMutation();
  const [updateAssembly, { isLoading: isUpdating }] = useUpdateAssemblyMutation();
  const [deleteAssembly, { isLoading: isDeleting }] = useDeleteAssemblyMutation();

  const assemblies = globalData?.assemblies || {};
  const organisms = globalData?.organisms || {};

  const assembliesArray: Assembly[] = Object.values(assemblies);
  const organismsArray: Organism[] = Object.values(organisms);

  const loading = globalLoading;
  const actionLoading = isAdding || isUpdating || isDeleting;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleAddAssembly = async (assemblyData: Assembly) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await addAssembly(assemblyData).unwrap();
      setFormSuccess('Assembly added successfully!');
      setShowAddForm(false);
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to add assembly');
    }
  };

  const handleUpdateAssembly = async (assemblyData: Assembly) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      await updateAssembly({
        assembly_id: assemblyData.assembly_id,
        assemblyData: {
          assembly_id: assemblyData.assembly_id,
          assembly_name: assemblyData.assembly_name,
          taxonomy_id: assemblyData.taxonomy_id,
          information: assemblyData.information,
        }
      }).unwrap();
      setFormSuccess('Assembly updated successfully!');
      setEditingAssembly(null);
    } catch (error: any) {
      setFormError(error.data?.message || error.message || 'Failed to update assembly');
    }
  };

  const handleDeleteAssembly = async (assemblyId: number) => {
    if (window.confirm('Are you sure you want to delete this assembly?')) {
      try {
        setFormError(null);
        setFormSuccess(null);

        await deleteAssembly(assemblyId).unwrap();
        setFormSuccess('Assembly deleted successfully!');
      } catch (error: any) {
        setFormError(error.data?.message || error.message || 'Failed to delete assembly');
      }
    }
  };

  const handleAssemblyClick = (assembly: Assembly) => {
    navigate(`/assemblies/${assembly.assembly_id}`);
  };

  const getOrganismName = (taxonomyId: number) => {
    const organism = organismsArray.find(org => org.taxonomy_id === taxonomyId);
    return organism ? `${organism.scientific_name} (${organism.common_name})` : `Taxonomy ID: ${taxonomyId}`;
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setEditingAssembly(null);
    setFormError(null);
    setFormSuccess(null);
  };

  if (loading) {
    return (
      <Container fluid className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (globalError) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error: {'status' in (globalError as any) ? `Error loading data (${(globalError as any).status})` : 'Failed to load data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Assembly Management</h2>
              <p className="text-muted mb-0">Manage assembly data in the database</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddForm(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-plus me-2"></i>
              Add Assembly
            </Button>
          </div>
        </Col>
      </Row>

      {formError && (
        <Alert variant="danger" dismissible onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert variant="success" dismissible onClose={() => setFormSuccess(null)}>
          {formSuccess}
        </Alert>
      )}

      <Row>
        <Col>
          {actionLoading && (
            <div className="text-center mb-3">
              <Spinner animation="border" size="sm" role="status" /> Updating...
            </div>
          )}
          <AssemblyTable
            assemblies={assembliesArray}
            organisms={organismsArray}
            onAssemblyClick={handleAssemblyClick}
            onEditAssembly={setEditingAssembly}
            onDeleteAssembly={handleDeleteAssembly}
            getOrganismName={getOrganismName}
          />
        </Col>
      </Row>

      {/* Assembly Form Modal */}
      <AssemblyForm
        organisms={organismsArray}
        assembly={editingAssembly}
        show={showAddForm || editingAssembly !== null}
        onSubmit={(data) => {
          if (editingAssembly) {
            handleUpdateAssembly({ ...data, assembly_id: editingAssembly.assembly_id });
          } else {
            handleAddAssembly({
              assembly_id: -1, // not used for adding
              assembly_name: data.assembly_name,
              taxonomy_id: data.taxonomy_id,
              information: data.information,
            });
          }
        }}
        onCancel={handleCloseModal}
      />
    </Container>
  );
};

export default AssemblyManagement;