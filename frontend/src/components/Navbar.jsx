// =============================================================
// components/Navbar.jsx
// =============================================================
// Top navigation bar. A "presentational" component — it receives
// data via props and displays it. No API calls here.
//
// PROPS:
//   Props (properties) are how parent components pass data DOWN
//   to child components. They're read-only — a child cannot
//   modify its own props (only the parent can change them).
//
//   Parent:  <Navbar user={user} onLogout={handleLogout} />
//   Child:   function Navbar({ user, onLogout }) { ... }
// =============================================================

import React from 'react';
import styles from './Navbar1.module.css';

// Destructuring props: instead of props.user and props.onLogout,
// we pull them out in the function signature for cleaner code
export default function Navbar({ user, onLogout }) {
  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>⚡ SnapLink</div>

      {/* Right side: user info + logout */}
      <div className={styles.right}>
        {/* Greeting with user's name */}
        {user && (
          <span className={styles.greeting}>
            Hi, {user.name?.split(' ')[0]} {/* show first name only */}
          </span>
        )}
        <button className={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
