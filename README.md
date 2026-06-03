# SnapLink — URL Shortener with Analytics

A full-stack URL shortener built with React, Node.js, and MongoDB featuring secure authentication, analytics tracking, intelligent caching, and automatic link expiration.

Built by **Himanshu Dhruw**.

[Live Demo](https://url-shortner-parknx14.vercel.app/) • [GitHub Repository](https://github.com/Parknx14/URL_Shortner)

---

## Features

* Base62 URL shortening with collision handling
* Custom alias support with reserved keyword validation
* JWT authentication and protected routes
* Analytics dashboard with:

  * Click volume
  * Device breakdown
  * Top referrers
  * Geographic insights
* In-memory caching for low-latency redirects
* Rate limiting per IP and authenticated user
* Automatic URL expiration using MongoDB TTL indexes
* Responsive React frontend

---

## Tech Stack

### Frontend

* React.js
* Vite
* Chart.js
* Context API

### Backend

* Node.js
* Express.js
* JWT
* bcrypt

### Database

* MongoDB Atlas

### Deployment

* Vercel
* Render

---

## Project Structure

```bash
snaplink/
├── backend/
├── frontend/
```

---

## Local Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file inside `backend/`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

---

## Key Implementation Details

### URL Shortening Engine

Implemented Base62 encoding with collision handling and custom alias support. Reserved aliases are blocked to prevent route conflicts.

### Redirect Caching

Frequently accessed URLs are cached in memory using a TTL-based key-value store, reducing database lookups and improving redirect response times.

### Analytics Dashboard

Tracks and visualizes:

* Click volume
* Device distribution
* Traffic referrers
* Geographic traffic insights

### Security

* JWT authentication
* Password hashing with bcrypt
* API rate limiting
* Validation middleware for protected routes

### Automatic Cleanup

MongoDB TTL indexes automatically remove expired links without requiring scheduled cleanup jobs.

---

## Future Improvements

* Redis integration
* QR code generation
* Password-protected links
* Custom domains
* Analytics export support

---

## Author

**Himanshu Dhruw**


