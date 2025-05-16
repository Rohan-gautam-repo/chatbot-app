import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthProvider';

// Import your pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const Routes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (isLoading) return <div className="loading">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
  };

  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </RouterRoutes>
  );
};

export default Routes;