// App.jsx - Fixed routing logic for Google OAuth
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Dashboard from './dashboard/Dashboard';
import Habit from './habits/Habit';
import Goal from './goals/Goal';
import CheckIn from './checkin/CheckIn';

// Auth components
import GoogleLogin from './auth/GoogleLogin';
import ProtectedRoute from './auth/ProtectedRoute';

// Loading component
const AppLoading = () => (
  <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient">
    <div className="text-center">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-5">
          {/* Spinner */}
          <div className="d-flex justify-content-center mb-4">
            <div
              className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "90px", height: "90px" }}
            >
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
              </div>
            </div>
          </div>

          {/* Text */}
          <h4 className="fw-bold text-dark mb-2">Loading...</h4>
          <p className="text-muted mb-0">
            Please wait while we prepare things for you
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Main app routes component
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <AppLoading />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar className="flex-shrink-0" />
      <main className="flex-grow-1">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" replace /> :
                <Navigate to="/login" replace />
            }
          />

          <Route
            path="/login"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" replace /> :
                <GoogleLogin />
            }
          />

          {/* Redirect old register route to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Protected routes - only accessible when authenticated */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <Habit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <CheckIn />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect based on auth status */}
          <Route
            path="*"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" replace /> :
                <Navigate to="/login" replace />
            }
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;