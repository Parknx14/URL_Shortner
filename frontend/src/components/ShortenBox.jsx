// =============================================================
// components/ShortenBox.jsx
// =============================================================
// The URL shortener input form — the core feature of the app.
//
// WHAT IT DOES:
//   1. User pastes a long URL
//   2. Optionally enters a custom alias or expiry
//   3. Clicks "Shorten"
//   4. Calls POST /api/urls
//   5. Shows the result with a copy button
//
// COMPONENT COMMUNICATION:
//   This component doesn't manage the URL list — the parent
//   (Dashboard) does. When a URL is created successfully,
//   this component calls onCreated(newUrl) — a prop function —
//   to notify the parent. The parent updates the list.
//   This is the "lifting state up" pattern.
// =============================================================

import React, { useState } from 'react';
import api from '../utils/api';
import styles from './ShortenBox.module.css';

export default function ShortenBox({ onCreated, onError }) {
  const [longUrl,     setLongUrl]     = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresIn,   setExpiresIn]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null); // the created URL
  const [copied,      setCopied]      = useState(false);

  const handleShorten = async () => {
    if (!longUrl.trim()) {
      onError('Please enter a URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // POST /api/urls with the form data
      const res = await api.post('/urls', {
        longUrl: longUrl.trim(),
        customAlias: customAlias.trim() || undefined, // undefined = don't send field
        expiresIn:   expiresIn || undefined,
      });

      setResult(res.data); // { url, shortUrl }
      setLongUrl('');
      setCustomAlias('');
      setExpiresIn('');
      onCreated(res.data.url); // notify parent

    } catch (err) {
      onError(err.response?.data?.error || 'Failed to create short URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      onError('Could not copy to clipboard');
    }
  };

  // Allow pressing Enter in the main input to submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleShorten();
  };

  return (
    <section className={styles.section}>
      <h1 className={styles.hero}>Shorten. Track. Optimize.</h1>
      <p className={styles.sub}>
        Transform long URLs into powerful short links with full analytics.
      </p>

      {/* MAIN INPUT ROW */}
      <div className={styles.inputRow}>
        <input
          className={styles.urlInput}
          type="url"
          placeholder="https://your-very-long-url.com/goes/here..."
          value={longUrl}
          onChange={e => setLongUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className={styles.shortenBtn}
          onClick={handleShorten}
          disabled={loading}
        >
          {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }}></span> : 'Shorten →'}
        </button>
      </div>

      {/* OPTIONS ROW */}
      <div className={styles.optionsRow}>
        <input
          type="text"
          className={styles.optionInput}
          placeholder="Custom alias (optional)"
          value={customAlias}
          onChange={e => setCustomAlias(e.target.value)}
          maxLength={30}
        />
        <select
          className={styles.optionInput}
          value={expiresIn}
          onChange={e => setExpiresIn(e.target.value)}
        >
          <option value="">Never expires</option>
          <option value="1h">Expires in 1 hour</option>
          <option value="24h">Expires in 24 hours</option>
          <option value="7d">Expires in 7 days</option>
          <option value="30d">Expires in 30 days</option>
        </select>
      </div>

      {/* RESULT — shown after successful shortening */}
      {result && (
        <div className={styles.result}>
          <div>
            <div className={styles.resultLabel}>Your short URL</div>
            <div className={styles.resultUrl}>{result.shortUrl}</div>
          </div>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </section>
  );
}
