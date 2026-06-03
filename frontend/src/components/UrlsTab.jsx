

import React, { useState } from 'react';
import api from '../utils/api';
import styles from './UrlsTab1.module.css';

// Helper: formats timestamp to relative time like "2h ago"
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const m = 60 * 1000, h = 60 * m, d = 24 * h;
  if (diff < m)  return 'just now';
  if (diff < h)  return `${Math.floor(diff / m)}m ago`;
  if (diff < d)  return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / d)}d ago`;
}

// Helper: formats numbers with commas
const fmt = n => (n || 0).toLocaleString();

export default function UrlsTab({ urls, loading, onDeleted, onClickSimulated }) {
  // Track which URL's copy button was clicked (to show "Copied!" feedback)
  const [copiedId, setCopiedId] = useState(null);
  // Track which URL is being deleted (disable its button while request pending)
  const [deletingId, setDeletingId] = useState(null);
  const [clickingId, setClickingId] = useState(null);

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(`http://localhost:5000/${url.shortCode}`);
      setCopiedId(url.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {}
  };

  const handleDelete = async (url) => {
    if (!window.confirm(`Delete "${url.title}"? This cannot be undone.`)) return;
    setDeletingId(url.id);
    try {
      await api.delete(`/urls/${url.id}`);
      onDeleted(url.id); // notify parent to remove from list
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSimulateClick = async (url) => {
    setClickingId(url.id);
    try {
      await api.post(`/urls/${url.id}/click`);
      onClickSimulated(); // tell parent to refresh data
    } catch (err) {
      alert('Click simulation failed');
    } finally {
      setClickingId(null);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className={styles.centered}>
        <div className="spinner" style={{ width: 28, height: 28 }}></div>
      </div>
    );
  }

  // EMPTY STATE
  if (urls.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🔗</div>
        <div className={styles.emptyText}>No URLs yet</div>
        <div className={styles.emptyHint}>Shorten your first URL using the input above!</div>
      </div>
    );
  }

  // URL TABLE
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Your Shortened URLs ({urls.length})</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title / Original URL</th>
              <th>Short Code</th>
              <th>Clicks</th>
              <th>Expires</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Map each URL to a table row */}
            {urls.map(url => {
              const isExpired = url.expiresAt && url.expiresAt < Date.now();

              return (
                <tr key={url.id} className={styles.row}>
                  {/* Title + original URL */}
                  <td>
                    <div className={styles.urlTitle}>{url.title || 'Untitled'}</div>
                    <div className={styles.urlLong} title={url.longUrl}>
                      {url.longUrl}
                    </div>
                  </td>

                  {/* Short code with copy button */}
                  <td>
                    <div className={styles.codeRow}>
                      <span className={styles.code}>
                        {url.shortCode}
                      </span>
                      <button
                        className={`${styles.copyBtn} ${copiedId === url.id ? styles.copied : ''}`}
                        onClick={() => handleCopy(url)}
                      >
                        {copiedId === url.id ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </td>

                  {/* Click count */}
                  <td>
                    <span className={styles.clicks}>{fmt(url.clicks)}</span>
                  </td>

                  {/* Expiry badge */}
                  <td>
                    {!url.expiresAt ? (
                      <span className={`${styles.badge} ${styles.badgeGreen}`}>Never</span>
                    ) : isExpired ? (
                      <span className={`${styles.badge} ${styles.badgeRed}`}>Expired</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeYellow}`}>
                        {timeAgo(url.expiresAt).replace(' ago', '')} left
                      </span>
                    )}
                  </td>

                  {/* Created time */}
                  <td className={styles.timeCell}>{timeAgo(url.createdAt)}</td>

                  {/* Action buttons */}
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleSimulateClick(url)}
                        disabled={clickingId === url.id}
                        title="Simulate a click (for analytics demo)"
                      >
                        {clickingId === url.id ? '...' : '+ Click'}
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(url)}
                        disabled={deletingId === url.id}
                      >
                        {deletingId === url.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
