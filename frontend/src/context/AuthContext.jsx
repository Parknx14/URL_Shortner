// =============================================================
// context/AuthContext.jsx
// =============================================================
// React Context for authentication state.
//
// THE PROBLEM CONTEXT SOLVES:
//   Imagine this component tree:
//     <App>
//       <Navbar>         ← needs to show user's name
//         <UserMenu />   ← needs user data
//       </Navbar>
//       <Dashboard>      ← needs to know if logged in
//         <UrlList />    ← needs user ID for API calls
//       </Dashboard>
//     </App>
//
//   Without Context: you'd pass user as a prop through every component.
//   This is called "prop drilling" and gets messy fast.
//
//   With Context: any component can access user data directly,
//   no matter how deep it is in the tree.
//
// HOW REACT CONTEXT WORKS:
//   1. Create a Context object
//   2. Wrap your app in a Provider that holds the state
//   3. Any child component calls useContext() to access it
// =============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// STEP 1: Create the Context
// This creates an object with a Provider and Consumer
const AuthContext = createContext(null);

// =============================================================
// AuthProvider Component
// Wraps the entire app (in App.jsx) and provides auth state.
// Any component inside this can call useAuth() to get:
//   - user: the logged-in user object (or null)
//   - login(): function to log in
//   - logout(): function to log out
//   - loading: true while checking if user is logged in
// =============================================================
export function AuthProvider({ children }) {
  // useState: declares a state variable.
  // When state changes, React re-renders the component.
  // const [value, setValue] = useState(initialValue)
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true = checking auth status

  // useEffect: runs code after the component mounts (appears on screen).
  // The [] at the end means "run this only ONCE when the app loads".
  // In class components, this was componentDidMount().
  useEffect(() => {
    // On app load, check if we have a saved token and validate it
    const savedUser = localStorage.getItem('snaplink_user');
    const token     = localStorage.getItem('snaplink_token');

    if (savedUser && token) {
      try {
        // Parse the saved user from localStorage
        setUser(JSON.parse(savedUser));
        // Optionally verify token is still valid with the server
        api.get('/auth/me')
          .then(res => setUser(res.data.user))
          .catch(() => {
            // Token invalid or expired — clear everything
            localStorage.removeItem('snaplink_token');
            localStorage.removeItem('snaplink_user');
            setUser(null);
          });
      } catch (e) {
        setUser(null);
      }
    }
    setLoading(false); // done checking
  }, []); // empty array = run once on mount

  /**
   * login(email, password)
   * Calls the API, saves token, updates state.
   * Returns { success: true } or { error: 'message' }
   */
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      // Save to localStorage so user stays logged in after refresh
      localStorage.setItem('snaplink_token', token);
      localStorage.setItem('snaplink_user', JSON.stringify(user));

      setUser(user); // update React state → triggers re-render
      return { success: true };
    } catch (err) {
      // err.response.data contains our API's error message
      return { error: err.response?.data?.error || 'Login failed' };
    }
  };

  /**
   * register(name, email, password)
   * Creates account, saves token, updates state.
   */
  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user } = res.data;

      localStorage.setItem('snaplink_token', token);
      localStorage.setItem('snaplink_user', JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (err) {
      return { error: err.response?.data?.error || 'Registration failed' };
    }
  };

  /**
   * logout()
   * Clears token and user data.
   */
  const logout = () => {
    localStorage.removeItem('snaplink_token');
    localStorage.removeItem('snaplink_user');
    setUser(null);
  };

  // The value object is what gets passed to all consumers
  // Any change to these values causes consumers to re-render
  const value = { user, loading, login, register, logout };

  return (
    // STEP 2: Provide the context value to all children
    // Every component inside <AuthProvider> can access `value`
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================
// useAuth() — Custom Hook
// A "custom hook" is just a function that uses other hooks.
// Calling useAuth() is much cleaner than useContext(AuthContext).
//
// Usage in any component:
//   const { user, login, logout } = useAuth()
// =============================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // This error helps developers know they forgot to wrap with AuthProvider
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
