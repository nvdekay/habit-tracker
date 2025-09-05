// auth/ProtectedRoute.jsx - Updated for better compatibility with fixed auth system
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, error } = useAuth();
  const location = useLocation();

  useEffect(() => {
    
  }, [isAuthenticated, loading, user, error, location.pathname]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mb-2">Verifying Authentication...</h5>
              <p className="text-muted mb-0">Please wait while we check your login status</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical authentication error
  if (error && error.includes('Failed to initialize')) {
    console.error('ProtectedRoute - Critical authentication error:', error);
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-5">
              <div className="text-danger mb-3">
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5 className="mb-2 text-danger">Authentication Error</h5>
              <p className="text-muted mb-3">{error}</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Force a hard reload to reset the app state
                  window.location.href = '/';
                }}
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // The isAuthenticated check is the primary guard
  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Additional safety check for user object
  if (!user) {

    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Authentication successful, render protected content

  return children;
};

// HOC version for easier usage with components
export const withAuthProtection = (WrappedComponent) => {
  const ProtectedComponent = (props) => (
    <ProtectedRoute>
      <WrappedComponent {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withAuthProtection(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ProtectedComponent;
};

// Debug component to show auth state (useful for development)
export const AuthDebugInfo = () => {
  const auth = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <strong>Auth Debug:</strong><br />
      Loading: {auth.loading ? 'Yes' : 'No'}<br />
      Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}<br />
      User: {auth.user ? auth.user.email : 'None'}<br />
      User ID: {auth.user ? auth.user.id : 'None'}<br />
      Error: {auth.error || 'None'}<br />
      Session: {auth.session ? 'Active' : 'None'}
    </div>
  );
};

// Simple authentication checker hook for use in components
export const useAuthCheck = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  return {
    isAuthenticated: isAuthenticated && !!user && !loading,
    isLoading: loading,
    user: user
  };
};

export default ProtectedRoute;