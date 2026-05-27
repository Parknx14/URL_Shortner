// =============================================================
// components/Toast.jsx
// =============================================================
// Temporary notification that appears and disappears.
// Parent controls when it shows (passes message + type as props).
// =============================================================

import React from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'info' }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
