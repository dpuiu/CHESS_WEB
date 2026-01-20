import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
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