import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchDatabaseList, 
  fetchTableData,
  resetDatabase, 
  clearTable,
  createBackup,
  restoreBackup
} from '../redux/adminData/adminDataThunks';
import { clearGlobalData } from '../redux/globalData/globalDataSlice';
import { DatabaseListResponse, DatabaseTableDataResponse } from '../redux/adminData/adminDataSlice';
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
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.adminData);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [clearTableName, setClearTableName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  const [expanded, setExpanded] = useState<{ [table: string]: boolean }>({});
  const [sectionsExpanded, setSectionsExpanded] = useState<{ tables: boolean; views: boolean }>({ 
    tables: true, 
    views: true 
  });
  const [searchTerms, setSearchTerms] = useState<{ [table: string]: string }>({});
  
  // Local state for database data
  const [databaseList, setDatabaseList] = useState<DatabaseListResponse | null>(null);
  const [tableData, setTableData] = useState<{ [tableName: string]: DatabaseTableDataResponse }>({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseList();
  }, [dispatch]);

  const loadDatabaseList = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const data: DatabaseListResponse = await dispatch(fetchDatabaseList()).unwrap();
      setDatabaseList(data);
    } catch (error) {
      setDbError(error instanceof Error ? error.message : 'Failed to fetch database list');
    } finally {
      setDbLoading(false);
    }
  };

  const loadTableData = async (tableName: string, search?: string, limit: number = 10) => {
    try {
      const data: DatabaseTableDataResponse = await dispatch(fetchTableData({ tableName, search, limit })).unwrap();
      setTableData(prev => ({ ...prev, [tableName]: data }));
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to fetch table data');
    }
  };

  const performResetDatabase = async () => {
    try {
      const result = await dispatch(resetDatabase()).unwrap();
      return result;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to reset database');
    }
  };

  const performClearTable = async (tableName: string) => {
    try {
      const result = await dispatch(clearTable(tableName)).unwrap();
      return result;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to clear table');
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
      // Refresh database list after reset
      await loadDatabaseList();
      // Trigger global data reload
      dispatch(clearGlobalData());
      // Clear all table data
      setTableData({});
      Object.keys(expanded).forEach(tableName => {
        setExpanded(prev => ({ ...prev, [tableName]: false }));
      });
      setSearchTerms({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to reset the database.');
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
      // Trigger global data reload
      dispatch(clearGlobalData());
      // Refresh the table data
      if (expanded[clearTableName]) {
        await loadTableData(clearTableName, undefined, 10);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to clear table.');
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
      const result = await dispatch(createBackup(backupPath)).unwrap();
      setMessage(result.message || 'Database backup created successfully.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create database backup.');
      setMessageType('danger');
    }
  };

  const handleBackupCancel = () => {
    setShowBackupModal(false);
  };

  const handleRestoreConfirm = async (backupPath: string) => {
    setShowRestoreModal(false);
    setMessage(null);
    
    try {
      const result = await dispatch(restoreBackup(backupPath)).unwrap();
      setMessage(result.message || 'Database restored successfully from backup.');
      setMessageType('success');
      // Refresh database list after restore
      await loadDatabaseList();
      // Trigger global data reload
      dispatch(clearGlobalData());
      // Clear all table data
      setTableData({});
      Object.keys(expanded).forEach(tableName => {
        setExpanded(prev => ({ ...prev, [tableName]: false }));
      });
      setSearchTerms({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to restore database from backup.');
      setMessageType('danger');
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
            databaseList={databaseList}
            tableData={tableData}
            loading={dbLoading}
            error={dbError}
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
        loading={loading}
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