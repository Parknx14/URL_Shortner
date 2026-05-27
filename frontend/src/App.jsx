// =============================================================
// src/App.jsx
// =============================================================
// The ROOT component of the React application.
//
// WHAT IS A COMPONENT?
//   A component is a JavaScript function that returns JSX (HTML-like syntax).
//   React builds the UI by composing components like Lego bricks.
//
// WHAT IS JSX?
//   JSX lets you write HTML-like code inside JavaScript.
//   It looks like HTML but it's actually JavaScript.
//   React converts it to real DOM elements.
//
//   JSX:   <div className="card"><h1>{title}</h1></div>
//   JS:    React.createElement('div', {className:'card'}, React.createElement('h1',null,title))
//
// REACT ROUTER:
//   React Router handles navigation in a Single Page Application.
//   Instead of loading new HTML pages from the server, it
//   swaps out components based on the URL.
//
//   <Route path="/dashboard" element={<Dashboard />} />
//   → when URL = /dashboard, show the Dashboard component
// =============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page components (each is a full "screen" of the app)
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard    from './pages/Dashboard';

// =============================================================
// ProtectedRoute Component
// Wraps routes that require the user to be logged in.
// If not logged in: redirect to /login
// If logged in: show the requested page
//
// This is a common pattern — you'll see it in almost every app.
// =============================================================
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking auth status (verifying token with server)
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div className="spinner" style={{ width:32, height:32 }}></div>
      </div>
    );
  }

  // Not logged in → redirect to login
  // <Navigate> is React Router's redirect component
  if (!user) return <Navigate to="/login" replace />;

  // Logged in → show the actual page
  return children;
}

// =============================================================
// App Component
// The root of the component tree. Sets up:
//   - AuthProvider: global auth state
//   - BrowserRouter: enables URL-based routing
//   - Routes: maps URLs to components
// =============================================================
function App() {
  return (
    // AuthProvider wraps everything so all components can access auth state
    <AuthProvider>
      {/*
        BrowserRouter enables history-based routing.
        It uses the HTML5 History API (no # in URLs).
        Alternative: HashRouter (uses #/dashboard in URL)
      */}
      <BrowserRouter>
        {/*
          Routes: only renders the FIRST matching Route.
          Like a switch statement for URLs.
        */}
        <Routes>
          {/* Public routes — anyone can visit */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected route — must be logged in */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect: / → /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all: any unknown URL → /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
