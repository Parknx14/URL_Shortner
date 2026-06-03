

import React from 'react';
import ReactDOM from 'react-dom/client'; 
import App from './App';                 // our root component
import './styles/global1.css';            // global CSS styles


const root = ReactDOM.createRoot(document.getElementById('root'));


root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
