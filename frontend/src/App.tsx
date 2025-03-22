import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Tables from './components/Tables';
import ProtectedRoute from './components/ProtectedRoute';
import Menu from './components/Menu';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/menu" element={<Menu />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <ProtectedRoute allowedRoles={['admin', 'waiter']}>
            <Tables />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}

export default App;