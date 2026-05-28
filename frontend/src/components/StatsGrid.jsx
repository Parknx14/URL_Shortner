// =============================================================
// components/StatsGrid.jsx
// =============================================================
// Displays 4 stat chips: Total URLs, Total Clicks, Clicks Today,
// Cache Hit Rate.
//
// PURE/PRESENTATIONAL COMPONENT:
//   This component has NO state and NO side effects.
//   It just receives data via props and renders it.
//   These are the simplest and most reusable components.
// =============================================================

import React from 'react';
import styles from './StatsGrid1.module.css';

// Helper: formats numbers with commas → 10500 becomes "10,500"
const fmt = n => (n || 0).toLocaleString();

export default function StatsGrid({ stats }) {
  // Array of chip definitions — we map() over them to avoid repeating JSX
  // map() creates a new array by transforming each item
  const chips = [
    {
      label: 'Total URLs',
      value: fmt(stats.totalUrls),
      sub: `${fmt(stats.activeUrls)} active`,
      color: 'var(--accent)',
    },
    {
      label: 'Total Clicks',
      value: fmt(stats.totalClicks),
      sub: `${fmt(stats.clicksToday)} today`,
      color: 'var(--accent2)',
    },
    {
      label: 'Cache Hit Rate',
      value: `${stats.cache?.hitRate ?? 0}%`,
      sub: `${stats.cache?.hits ?? 0} hits / ${stats.cache?.misses ?? 0} misses`,
      color: 'var(--accent3)',
    },
    {
      label: 'Active Links',
      value: fmt(stats.activeUrls),
      sub: `of ${fmt(stats.totalUrls)} total`,
      color: 'var(--warning)',
    },
  ];

  return (
    <div className={styles.grid}>
      {/*
        .map((item, index) => ...) — transforms each chip definition into JSX.
        key={index}: React requires a unique key on each item in a list.
        Keys help React identify which items changed for efficient updates.
      */}
      {chips.map((chip, index) => (
        <div key={index} className={styles.chip} style={{ '--chip-color': chip.color }}>
          <div className={styles.label}>{chip.label}</div>
          <div className={styles.value}>{chip.value}</div>
          <div className={styles.sub}>{chip.sub}</div>
        </div>
      ))}
    </div>
  );
}
