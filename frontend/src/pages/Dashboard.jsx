// =============================================================
// pages/Dashboard.jsx
// =============================================================
// The main app screen after login. Contains:
//   - Navbar
//   - URL shortener input box
//   - Stats overview chips
//   - Tabs: Analytics | My URLs | Tech Stack
//
// KEY REACT CONCEPTS HERE:
//   useEffect  → fetches data when component loads
//   useState   → tracks URLs list, stats, active tab
//   Lifting state up → parent holds data, passes to children
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import Navbar      from '../components/Navbar';
import ShortenBox  from '../components/ShortenBox';
import StatsGrid   from '../components/StatsGrid';
import AnalyticsTab from '../components/AnalyticsTab';
import UrlsTab     from '../components/UrlsTab';

import Toast       from '../components/Toast';

import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // =============================================================
  // STATE
  // All data lives here at the top level (parent component).
  // We pass it down to child components as "props".
  // When we update state here, ALL child components that use
  // this data will automatically re-render.
  // =============================================================
  const [urls,      setUrls]      = useState([]);    // list of shortened URLs
  const [globalStats, setGlobalStats] = useState(null); // overall stats
  const [activeTab, setActiveTab] = useState('analytics'); // which tab is shown
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);  // { message, type }

  // =============================================================
  // DATA FETCHING
  // useCallback: memoizes the function so it doesn't get recreated
  // on every render. This is an optimization — only matters when
  // the function is passed as a prop or used in useEffect deps.
  // =============================================================
  const fetchData = useCallback(async () => {
    try {
      // Run both API calls at the same time (parallel, not sequential)
      // Promise.all([p1, p2]) waits for BOTH to finish
      // Much faster than: await p1; await p2; (sequential)
      const [urlsRes, statsRes] = await Promise.all([
        api.get('/urls'),
        api.get('/urls/stats/global'),
      ]);
      setUrls(urlsRes.data.urls);
      setGlobalStats(statsRes.data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      // finally runs whether the try succeeded or catch ran
      setLoading(false);
    }
  }, []); // empty deps = function never changes

  // Run fetchData when the component first mounts (appears on screen)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============================================================
  // TOAST HELPER
  // Shows a temporary notification message.
  // After 3 seconds, clears itself.
  // =============================================================
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =============================================================
  // HANDLERS — functions passed to child components
  // Children call these to trigger actions in the parent.
  // This is called "lifting state up" — the parent controls data.
  // =============================================================

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUrlCreated = (newUrl) => {
    // Prepend new URL to the list (newest first)
    setUrls(prev => [newUrl, ...prev]);
    setGlobalStats(prev => prev ? { ...prev, totalUrls: prev.totalUrls + 1 } : prev);
    showToast('Short URL created!', 'success');
    setActiveTab('urls'); // switch to URLs tab to see the new one
  };

  const handleUrlDeleted = (id) => {
    setUrls(prev => prev.filter(u => u.id !== id));
    setGlobalStats(prev => prev ? { ...prev, totalUrls: prev.totalUrls - 1 } : prev);
    showToast('URL deleted', 'success');
  };

  const handleClickSimulated = () => {
    // Refresh data to get updated click counts
    fetchData();
    showToast('Click recorded!', 'success');
  };

  return (
    <div className={styles.page}>
      {/* NAVBAR — top bar with logo and user info */}
      <Navbar user={user} onLogout={handleLogout} />

      <main className={styles.main}>
        {/* URL SHORTENER INPUT */}
        <ShortenBox onCreated={handleUrlCreated} onError={(msg) => showToast(msg, 'error')} />

        {/* STATS OVERVIEW */}
        {globalStats && <StatsGrid stats={globalStats} />}

        {/* TAB BAR */}
        <div className={styles.tabBar}>
          {[
            { id: 'analytics', label: '📈 Analytics' },
            { id: 'urls',      label: '🔗 My URLs' },
         
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT — only the active tab renders */}
        {activeTab === 'analytics' && (
          <AnalyticsTab urls={urls} />
        )}
        {activeTab === 'urls' && (
          <UrlsTab
            urls={urls}
            loading={loading}
            onDeleted={handleUrlDeleted}
            onClickSimulated={handleClickSimulated}
          />
        )}
       
      </main>

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
