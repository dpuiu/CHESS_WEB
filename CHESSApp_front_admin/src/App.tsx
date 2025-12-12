import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './redux/store';
import { fetchGlobalData } from './redux/globalData/globalDataThunks';
import { fetchDatabaseConfig } from './redux/databaseConfig/databaseConfigThunks';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
  const { lastUpdated } = useSelector((state: RootState) => state.globalData);
  const { lastUpdated: configLastUpdated } = useSelector((state: RootState) => state.databaseConfig);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!lastUpdated) {
      dispatch(fetchGlobalData());
    }
    if (!configLastUpdated) {
      dispatch(fetchDatabaseConfig());
    }
  }, [lastUpdated, configLastUpdated]);

  return (
    <div className="admin-app">
      <Header />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default App; 