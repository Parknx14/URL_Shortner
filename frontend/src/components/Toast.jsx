

import React from 'react';
import styles from './Toast1.module.css';

export default function Toast({ message, type = 'info' }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
