import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import {
  useGetGlobalDataQuery,
  useAddOrganismMutation,
  useUpdateOrganismMutation,
  useDeleteOrganismMutation
} from '../redux/api/apiSlice';
import { Organism } from '../types';
import { OrganismForm } from '../components/organismsManager/OrganismForm';
import { OrganismsTable } from '../components/organismsManager/OrganismsTable';
import './OrganismsManagement.css';

const OrganismsManagement: React.FC = () => {
  // RTK Query hooks
  const { data: globalData, isLoading: globalLoading, error: globalError } = useGetGlobalDataQuery();
  const [addOrganism, { isLoading: isAdding }] = useAddOrganismMutation();
  const [updateOrganism, { isLoading: isUpdating }] = useUpdateOrganismMutation();
  const [deleteOrganism, { isLoading: isDeleting }] = useDeleteOrganismMutation();

  const organisms = globalData?.organisms;

  // Combine loading states for UI feedback (optional, or handle granularly)
  const loading = globalLoading;
  const actionLoading = isAdding || isUpdating || isDeleting;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrganism, setEditingOrganism] = useState<Organism | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleAddOrganism = async (organismData: Organism) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      const result = await addOrganism(organismData).unwrap();
      setFormSuccess(result.message || 'Organism added successfully');
      setShowAddForm(false);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to add organism');
    }
  };

  const handleEditOrganism = async (taxonomy_id: number, organismData: Organism) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      const result = await updateOrganism({ taxonomy_id, organismData }).unwrap();
      setFormSuccess(result.message || 'Organism updated successfully');
      setEditingOrganism(null);
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to update organism');
    }
  };

  const handleDeleteOrganism = async (taxonomy_id: number) => {
    if (!window.confirm('Are you sure you want to delete this organism?')) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      const result = await deleteOrganism(taxonomy_id).unwrap();
      setFormSuccess(result.message || 'Organism deleted successfully');
    } catch (err: any) {
      setFormError(err.data?.message || err.message || 'Failed to delete organism');
    }
  };

  return (
    <Container fluid className="organisms-management">
      <Row>
        <Col>
          <div className="organisms-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="organisms-title">Organisms Management</h2>
                <p className="organisms-subtitle">Manage organism data in the database</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(true)}
                disabled={actionLoading}
              >
                <i className="fas fa-plus me-2"></i>
                Add New Organism
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {globalError && (
        <Alert variant="danger">
          {'status' in (globalError as any) ? `Error loading global data (${(globalError as any).status})` : 'Failed to load data'}
        </Alert>
      )}

      {formError && (
        <Alert variant="danger">
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert variant="success">
          {formSuccess}
        </Alert>
      )}

      {loading ? (
        <div className="loading-spinner">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-dna me-2"></i>
                  Organisms ({organisms ? Object.keys(organisms).length : 0})
                </h5>
              </Card.Header>
              <Card.Body>
                {actionLoading && (
                  <div className="text-center mb-3">
                    <Spinner animation="border" size="sm" role="status" /> Updating...
                  </div>
                )}
                <OrganismsTable
                  organisms={organisms || {}}
                  onEdit={(organism) => setEditingOrganism(organism)}
                  onDelete={handleDeleteOrganism}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <OrganismForm
        organism={editingOrganism}
        show={showAddForm || !!editingOrganism}
        onSubmit={(data) => {
          if (editingOrganism) {
            handleEditOrganism(editingOrganism.taxonomy_id, data);
          } else {
            handleAddOrganism(data);
          }
        }}
        onCancel={() => {
          setShowAddForm(false);
          setEditingOrganism(null);
          setFormError(null);
          setFormSuccess(null);
        }}
        isLoading={actionLoading}
      />
    </Container>
  );
};

export default OrganismsManagement;