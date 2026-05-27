// =============================================================
// pages/RegisterPage.jsx
// =============================================================
// Registration screen. Very similar to LoginPage — both are
// "form pages" that call different API endpoints.
//
// KEY DIFFERENCE from LoginPage:
//   - Has an extra "name" field
//   - Calls register() instead of login()
//   - Shows client-side validation (password length check)
//     before even hitting the server
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // CLIENT-SIDE VALIDATION
    // Always validate on frontend too (faster feedback for user)
    // Backend also validates (never trust the client alone!)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return; // stop here, don't call API
    }

    setLoading(true);
    const result = await register(name, email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>⚡ SnapLink</div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Start shortening URLs for free</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className={styles.error}>⚠ {error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Create Account'}
          </button>
        </form>

        <p className={styles.toggle}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
