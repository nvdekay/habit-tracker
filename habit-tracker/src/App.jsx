import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

// Auth components
import Login from './auth/Login';
import Register from './auth/Register';
import ProtectedRoute from './auth/ProtectedRoute';
import Habit from './components/Habit';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            {/* Public routes */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            {/* Protected routes */}
            <ProtectedRoute>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/habit" element={<Habit />} />
              </Routes>
            </ProtectedRoute>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;