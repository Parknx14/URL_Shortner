// =============================================================
// components/AnalyticsTab.jsx
// =============================================================
// Analytics dashboard with 4 charts:
//   1. Clicks over 7 days (Line chart)
//   2. Geographic distribution (Doughnut chart)
//   3. Device breakdown (Bar chart)
//   4. Referrer sources (Horizontal bar chart)
//
// CHART.JS WITH REACT:
//   We use 'react-chartjs-2' which wraps Chart.js in React components.
//   Before using any chart type, you must REGISTER it with Chart.js.
//   (This is Chart.js v4's tree-shaking system — only bundle what you use)
//
// useMemo:
//   Computes derived data (chart data) only when `urls` changes.
//   Without useMemo, it would recompute on EVERY render (wasteful).
// =============================================================

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import styles from './AnalyticsTab.module.css';

// REGISTER Chart.js components (required before use)
ChartJS.register(
  CategoryScale,  // X axis with categories (labels)
  LinearScale,    // Y axis with numbers
  PointElement,   // dots on line charts
  LineElement,    // the line itself
  BarElement,     // bars in bar charts
  ArcElement,     // slices in doughnut/pie charts
  Title, Tooltip, Legend,
  Filler          // fills area under line chart
);

// Shared Chart.js options for consistent styling
const chartOptions = (horizontal = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? 'y' : 'x', // 'y' = horizontal bars
  plugins: {
    legend: {
      labels: {
        color: '#6e6e8e',
        font: { family: "'Syne', sans-serif", size: 11 }
      }
    }
  },
  scales: horizontal
    ? {
        x: { ticks: { color: '#6e6e8e' }, grid: { color: 'rgba(42,42,58,0.5)' } },
        y: { ticks: { color: '#6e6e8e' }, grid: { color: 'rgba(42,42,58,0.5)' } }
      }
    : {
        x: { ticks: { color: '#6e6e8e' }, grid: { color: 'rgba(42,42,58,0.5)' } },
        y: { ticks: { color: '#6e6e8e', stepSize: 1 }, grid: { color: 'rgba(42,42,58,0.5)' } }
      }
});

// Color palette
const COLORS = [
  'rgba(124,92,252,0.8)',
  'rgba(252,92,124,0.8)',
  'rgba(92,252,180,0.8)',
  'rgba(252,220,92,0.8)',
  'rgba(92,152,252,0.8)',
  'rgba(252,152,92,0.8)',
  'rgba(252,92,212,0.8)',
];

export default function AnalyticsTab({ urls }) {
  // useMemo: only recompute when `urls` array changes
  // This aggregates all click data from all URLs
  const chartData = useMemo(() => {
    // Flatten: collect ALL clicks from all URLs
    // In a real app, we'd fetch this from GET /api/analytics
    // For now, we use the stats embedded in URL objects

    // CLICKS PER DAY (last 7 days)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }));
    }

    // Simulate realistic distribution of clicks across 7 days
    // In real app: API returns aggregated click data per day
    const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
    const clicksPerDay = days.map((_, i) => {
      const base = Math.floor(totalClicks / 7);
      const variance = Math.floor(Math.random() * (base * 0.5));
      return Math.max(0, base + (i % 2 === 0 ? variance : -variance));
    });

    // GEOGRAPHIC — simulated distribution
    const countries = ['India', 'USA', 'UK', 'Germany', 'Canada', 'France', 'Brazil'];
    const geoData = countries.map(() => Math.floor(Math.random() * 40 + 5));

    // DEVICE — simulated
    const deviceData = [
      Math.floor(totalClicks * 0.52),
      Math.floor(totalClicks * 0.38),
      Math.floor(totalClicks * 0.10),
    ];

    // REFERRER — simulated
    const referrers = ['Direct', 'Google', 'Twitter', 'WhatsApp', 'LinkedIn', 'Email'];
    const refData = referrers.map(() => Math.floor(Math.random() * 30 + 5));

    return { days, clicksPerDay, countries, geoData, deviceData, referrers, refData };
  }, [urls]); // dependency array: rerun when urls changes

  const hasData = urls.length > 0;

  if (!hasData) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📊</div>
        <div>Shorten your first URL to see analytics here!</div>
      </div>
    );
  }

  return (
    <div className={styles.grid}>

      {/* CHART 1: Line chart — clicks over time */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Clicks — Last 7 Days</div>
        <div className={styles.chartWrap}>
          <Line
            data={{
              labels: chartData.days,
              datasets: [{
                label: 'Clicks',
                data: chartData.clicksPerDay,
                borderColor: 'rgba(124,92,252,0.9)',
                backgroundColor: 'rgba(124,92,252,0.1)',
                fill: true,
                tension: 0.4,     // curve smoothness (0 = straight lines)
                pointRadius: 4,
                pointBackgroundColor: 'rgba(124,92,252,1)',
              }]
            }}
            options={chartOptions()}
          />
        </div>
      </div>

      {/* CHART 2: Doughnut — geographic distribution */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Geographic Distribution</div>
        <div className={styles.chartWrap}>
          <Doughnut
            data={{
              labels: chartData.countries,
              datasets: [{
                data: chartData.geoData,
                backgroundColor: COLORS,
                borderWidth: 0,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#6e6e8e',
                    font: { family: "'Syne', sans-serif", size: 10 },
                    boxWidth: 12,
                    padding: 8,
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* CHART 3: Bar — device breakdown */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Device Breakdown</div>
        <div className={styles.chartWrap}>
          <Bar
            data={{
              labels: ['Desktop', 'Mobile', 'Tablet'],
              datasets: [{
                label: 'Clicks',
                data: chartData.deviceData,
                backgroundColor: [COLORS[0], COLORS[1], COLORS[2]],
                borderRadius: 6,  // rounded bar tops
              }]
            }}
            options={{ ...chartOptions(), plugins: { legend: { display: false } } }}
          />
        </div>
      </div>

      {/* CHART 4: Horizontal Bar — referrer sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Referrer Sources</div>
        <div className={styles.chartWrap}>
          <Bar
            data={{
              labels: chartData.referrers,
              datasets: [{
                label: 'Clicks',
                data: chartData.refData,
                backgroundColor: 'rgba(252,92,124,0.8)',
                borderRadius: 6,
              }]
            }}
            options={{
              ...chartOptions(true), // horizontal=true
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>

    </div>
  );
}
