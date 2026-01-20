import React, { useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import {
  useGetDatabaseListQuery,
  useLazyGetTableDataQuery,
  useResetDatabaseMutation,
  useClearTableMutation,
  useCreateBackupMutation,
  useRestoreBackupMutation,
} from '../redux/api/apiSlice';
import { DatabaseListResponse, DatabaseTableDataResponse } from '../types';
import {
  DatabaseRequiredSettings,
  DatabaseHeader,
  DatabaseOverview,
  DatabaseConfirmationModal,
  DatabaseBackupRestoreModal,
  DatabaseCreateBackupModal
} from '../components/databaseManager';
import './DatabaseManagement.css';

const DatabaseManagement: React.FC = () => {
  // RTK Query Hooks
  const [triggerGetTableData] = useLazyGetTableDataQuery();
  const [resetDatabase, { isLoading: isResetting }] = useResetDatabaseMutation();
  const [clearTable, { isLoading: isClearing }] = useClearTableMutation();
  const [createBackup, { isLoading: isCreatingBackup }] = useCreateBackupMutation();
  const [restoreBackup, { isLoading: isRestoringBackup }] = useRestoreBackupMutation();

  // Database Query (handles loading and error automatically)
  const {
    data: databaseList,
    isLoading: dbListLoading,
    error: dbListError
  } = useGetDatabaseListQuery();

  // Derived loading state for performing actions
  const loading = isResetting || isClearing || isCreatingBackup || isRestoringBackup;

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [clearTableName, setClearTableName] = useState<string | null>(null);

  // UI State
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  const [expanded, setExpanded] = useState<{ [table: string]: boolean }>({});
  const [sectionsExpanded, setSectionsExpanded] = useState<{ tables: boolean; views: boolean }>({
    tables: true,
    views: true
  });
  const [searchTerms, setSearchTerms] = useState<{ [table: string]: string }>({});

  // Local state for table data (accumulated since we want to keep data for multiple expanded tables)
  // We manually manage this because useLazyQuery only keeps the last result.
  const [tableData, setTableData] = useState<{ [tableName: string]: DatabaseTableDataResponse }>({});

  const loadTableData = async (tableName: string, search?: string, limit: number = 10) => {
    try {
      // unwrap() returns the raw data or throws an error
      const data = await triggerGetTableData({ tableName, search, limit }).unwrap();
      setTableData(prev => ({ ...prev, [tableName]: data }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to fetch table data';
      // Re-throw to be caught by caller
      throw new Error(errorMessage);
    }
  };

  const performResetDatabase = async () => {
    try {
      const result = await resetDatabase().unwrap();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to reset database';
      throw new Error(errorMessage);
    }
  };

  const performClearTable = async (tableName: string) => {
    try {
      const result = await clearTable(tableName).unwrap();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to clear table';
      throw new Error(errorMessage);
    }
  };

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleBackupClick = () => {
    setShowBackupModal(true);
  };

  const handleRestoreClick = () => {
    setShowRestoreModal(true);
  };

  const handleResetConfirm = async () => {
    setShowResetModal(false);
    setMessage(null);

    try {
      await performResetDatabase();
      setMessage('Database has been reset successfully.');
      setMessageType('success');

      // Global Data and Database List are automatically invalidated by tags ('Database', 'GlobalData', etc)
      // We just need to clear local table data state
      setTableData({});
      Object.keys(expanded).forEach(tableName => {
        setExpanded(prev => ({ ...prev, [tableName]: false }));
      });
      setSearchTerms({});
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to reset the database.';
      setMessage(errorMessage);
      setMessageType('danger');
    }
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  const toggleExpand = async (tableName: string) => {
    const isCurrentlyExpanded = expanded[tableName];

    if (!isCurrentlyExpanded) {
      // Load table data when expanding
      try {
        await loadTableData(tableName, undefined, 10);
      } catch (error) {
        setMessage(`Failed to load data for ${tableName}: ${error}`);
        return;
      }
    }

    setExpanded(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const handleSearch = async (tableName: string, searchTerm: string) => {
    setSearchTerms(prev => ({ ...prev, [tableName]: searchTerm }));

    try {
      await loadTableData(tableName, searchTerm || undefined, 10);
    } catch (error) {
      setMessage(`Failed to search in ${tableName}: ${error}`);
    }
  };

  const toggleSection = (section: 'tables' | 'views') => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleClearTable = (tableName: string) => {
    setClearTableName(tableName);
    setShowClearModal(true);
  };

  const handleClearConfirm = async () => {
    if (!clearTableName) return;

    try {
      await performClearTable(clearTableName);
      setMessage(`Table ${clearTableName} cleared successfully.`);
      setMessageType('success');

      // Refresh the table data for the cleared table if it's open
      if (expanded[clearTableName]) {
        await loadTableData(clearTableName, undefined, 10);
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to clear table.';
      setMessage(errorMessage);
      setMessageType('danger');
    } finally {
      setClearTableName(null);
      setShowClearModal(false);
    }
  };

  const handleClearCancel = () => {
    setClearTableName(null);
    setShowClearModal(false);
  };

  const handleBackupConfirm = async (backupPath: string) => {
    setShowBackupModal(false);
    setMessage(null);

    try {
      const result = await createBackup(backupPath).unwrap();
      setMessage(result.message || 'Database backup created successfully.');
      setMessageType('success');
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to create database backup.';
      setMessage(errorMessage);
      setMessageType('danger');
    }
  };

  const handleBackupCancel = () => {
    setShowBackupModal(false);
  };

  const handleRestoreConfirm = async (backupPath: string, storageDirPath: string) => {
    setMessage(null);
    setIsRestoring(true);

    try {
      const result = await restoreBackup({ backupPath, storageDirPath }).unwrap();
      setMessage(result.message || 'Database restored successfully from backup.');
      setMessageType('success');

      // Cache invalidation handles reloading list
      // Clear all table data
      setTableData({});
      Object.keys(expanded).forEach(tableName => {
        setExpanded(prev => ({ ...prev, [tableName]: false }));
      });
      setSearchTerms({});
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to restore database from backup.';
      setMessage(errorMessage);
      setMessageType('danger');
    } finally {
      setIsRestoring(false);
      setShowRestoreModal(false);
    }
  };

  const handleRestoreCancel = () => {
    setShowRestoreModal(false);
  };

  return (
    <Container className="database-management">
      <Row>
        <Col>
          <DatabaseHeader
            onResetDatabase={handleResetClick}
            onBackupDatabase={handleBackupClick}
            onRestoreDatabase={handleRestoreClick}
            loading={loading}
          />

          {message && (
            <Alert variant={messageType} className="mt-3">
              {message}
            </Alert>
          )}

          <div>
            <DatabaseRequiredSettings
              loading={loading}
            />
          </div>

          <DatabaseOverview
            databaseList={databaseList || null}
            tableData={tableData}
            loading={dbListLoading}
            error={dbListError ? (
              'status' in dbListError && typeof dbListError.status === 'number'
                ? `Error loading database list (${dbListError.status})`
                : 'Failed to fetch database list'
            ) : null}
            expanded={expanded}
            sectionsExpanded={sectionsExpanded}
            searchTerms={searchTerms}
            onToggleExpand={toggleExpand}
            onToggleSection={toggleSection}
            onSearch={handleSearch}
            onClearTable={handleClearTable}
          />
        </Col>
      </Row>

      <DatabaseConfirmationModal
        showResetModal={showResetModal}
        showClearModal={showClearModal}
        clearTableName={clearTableName}
        loading={loading}
        onResetConfirm={handleResetConfirm}
        onClearConfirm={handleClearConfirm}
        onResetCancel={handleResetCancel}
        onClearCancel={handleClearCancel}
      />

      <DatabaseBackupRestoreModal
        showRestoreModal={showRestoreModal}
        loading={loading || isRestoring}
        onRestoreConfirm={handleRestoreConfirm}
        onRestoreCancel={handleRestoreCancel}
      />

      <DatabaseCreateBackupModal
        showCreateBackupModal={showBackupModal}
        initialBackupDirPath={null}
        loading={loading}
        onCreateBackupConfirm={handleBackupConfirm}
        onCreateBackupCancel={handleBackupCancel}
      />
    </Container>
  );
};

export default DatabaseManagement;