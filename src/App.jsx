import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Portfolio } from './pages/PortFolio.jsx';
import { Dashboard } from './pages/Dashboard.jsx';

const GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/Portfolio" replace />;
}

// Public Route Component
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        {/* Catch-all redirect */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/Portfolio"} replace />}
        />
      </Routes>
    </GoogleOAuthProvider>
  );
}