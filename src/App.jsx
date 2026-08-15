import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Portfolio } from './pages/Portfolio.jsx';
import { Dashboard } from './pages/Dashboard.jsx';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/Portfolio" replace />;
}

// Public Route Component (redirects to /dashboard if already logged in)
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/Portfolio"} replace />
        }
      />
      <Route
        path="/Portfolio"
        element={
          <PublicRoute>
            <Portfolio />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Catch-all redirect for undefined routes */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/Portfolio"} replace />}
      />
    </Routes>
  );
}