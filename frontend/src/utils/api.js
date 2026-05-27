// =============================================================
// utils/api.js
// =============================================================
// Centralized API client using Axios.
//
// WHAT IS AXIOS?
//   Axios is a library for making HTTP requests (like fetch, but
//   with nicer syntax and automatic JSON handling).
//
// WHY A CENTRALIZED API FILE?
//   Instead of writing fetch('/api/urls', { headers: { Authorization: ... } })
//   everywhere, we configure it ONCE here.
//
//   Every component imports from this file:
//     import api from '../utils/api'
//     api.get('/urls') → automatically adds auth header
//
// INTERCEPTORS:
//   Axios "interceptors" run before every request/after every response.
//   We use them to:
//     - REQUEST: automatically attach JWT token to every request
//     - RESPONSE: handle 401 errors globally (auto logout if token expired)
// =============================================================

import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  // baseURL: all requests are prefixed with this
  // api.get('/urls') → fetches http://localhost:5173/api/urls
  // (Vite proxies this to http://localhost:5000/api/urls)
  baseURL:  import.meta.env.VITE_API_URL,

  // timeout: if the server doesn't respond in 10s, reject the request
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json', // we send/expect JSON
  },
});

// =============================================================
// REQUEST INTERCEPTOR
// Runs BEFORE every HTTP request is sent.
// We use it to attach the JWT token.
// =============================================================
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('snaplink_token');

    if (token) {
      // Add the Authorization header: "Bearer eyJhbGci..."
      // This is how JWTs are sent with every request
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // must return config or the request is blocked
  },
  (error) => {
    // Request couldn't be sent (network error, etc.)
    return Promise.reject(error);
  }
);

// =============================================================
// RESPONSE INTERCEPTOR
// Runs AFTER every HTTP response is received.
// We use it to handle authentication errors globally.
// =============================================================
api.interceptors.response.use(
  (response) => {
    // 2xx responses — just pass through
    return response;
  },
  (error) => {
    // Check if it's a 401 Unauthorized response
    if (error.response?.status === 401) {
      // Token is expired or invalid — clear it and reload
      // This logs the user out automatically
      localStorage.removeItem('snaplink_token');
      localStorage.removeItem('snaplink_user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
