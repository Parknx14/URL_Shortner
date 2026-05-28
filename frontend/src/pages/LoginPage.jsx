// =============================================================
// pages/LoginPage.jsx
// =============================================================
// The login screen. A "page" component represents a full screen.
//
// REACT HOOKS USED HERE:
//   useState  → tracks form input values and error messages
//   useNavigate → programmatically redirects after login
//   useAuth   → our custom hook to call the login function
//
// CONTROLLED COMPONENTS:
//   In React, form inputs are "controlled" — React owns the value.
//   <input value={email} onChange={e => setEmail(e.target.value)} />
//   Every keystroke updates state → React re-renders → input shows new value.
//   This gives React full control over the form data.
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage1.module.css';

export default function LoginPage() {
  // useNavigate: lets us redirect the user programmatically
  // e.g., navigate('/dashboard') after successful login
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state — each input has its own state variable
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');    // error message to display
  const [loading,  setLoading]  = useState(false); // true while API call is in flight

  // =============================================================
  // handleSubmit — runs when the form is submitted
  // async/await: pauses execution until the API call finishes
  // =============================================================
  const handleSubmit = async (e) => {
    // e.preventDefault() stops the browser's default form behavior
    // (which would reload the page — we don't want that in React)
    e.preventDefault();
    setError('');    // clear previous errors
    setLoading(true);

    // Call the login function from AuthContext
    const result = await login(email, password);

    if (result.success) {
      // Redirect to dashboard on success
      navigate('/dashboard');
    } else {
      setError(result.error); // show error message
    }

    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logo}>⚡ SnapLink</div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        {/*
          onSubmit={handleSubmit}: runs handleSubmit when Enter is pressed
          or the submit button is clicked.
          This is the React way — no action="" or method="" needed.
        */}
        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            {/*
              value={email} — controlled input (React owns the value)
              onChange — updates state on every keystroke
              htmlFor matches the input's id (accessibility)
            */}
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Conditionally render error message — only shows when error exists */}
          {/* In JSX: {condition && <element />} renders element only if condition is true */}
          {error && (
            <div className={styles.error}>⚠ {error}</div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading} // disable button while request is pending
          >
            {/* Ternary operator: condition ? valueIfTrue : valueIfFalse */}
            {loading ? <span className="spinner"></span> : 'Sign In'}
          </button>
        </form>

        <p className={styles.toggle}>
          Don't have an account?{' '}
          {/* Link is React Router's <a> tag — navigates without page reload */}
          <Link to="/register">Create one free</Link>
        </p>

        {/* Demo credentials hint */}
        <div className={styles.demo}>
          <div className={styles.demoTitle}>Demo — create any account</div>
          <div>Register with any email + password to try it out</div>
        </div>
      </div>
    </div>
  );
}
