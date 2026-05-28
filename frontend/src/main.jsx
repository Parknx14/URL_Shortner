// =============================================================
// src/main.jsx
// =============================================================
// This is where React starts up.
//
// WHAT HAPPENS WHEN THE BROWSER LOADS THE PAGE:
//   1. Browser loads index.html
//   2. Browser sees <script src="/src/main.jsx">
//   3. main.jsx runs:
//      a. Imports React and ReactDOM
//      b. Finds <div id="root"> in the HTML
//      c. Mounts the <App /> component into it
//      d. React takes over — every UI update is now done by React
//
// ReactDOM.createRoot() is the modern React 18 API.
// The older API was ReactDOM.render() — you may see this in older tutorials.
// =============================================================

import React from 'react';
import ReactDOM from 'react-dom/client'; // 'react-dom/client' is the React 18 package
import App from './App';                 // our root component
import './styles/global1.css';            // global CSS styles

// Find the <div id="root"> and create a React root inside it
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the <App /> component (and everything inside it) into the root
root.render(
  // React.StrictMode: a development helper that:
  //   - Detects deprecated patterns
  //   - Warns about side effects in wrong places
  //   - Runs effects twice in dev mode to catch bugs
  // Has NO effect in production — it's invisible to users
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
