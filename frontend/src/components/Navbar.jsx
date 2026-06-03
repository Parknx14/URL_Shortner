

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
