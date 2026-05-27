# SnapLink — Full-Stack URL Shortener

A real full-stack project structured exactly like professional developers build it.
No single HTML file tricks — this is how it actually works.

## Project Structure

```
snaplink/
├── backend/          → Node.js + Express API server
└── frontend/         → React.js user interface
```

## How to Run

### Step 1 — Start the Backend
```bash
cd backend
npm install
npm run dev
```
Server starts at: http://localhost:5000

### Step 2 — Start the Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
App opens at: http://localhost:5173

## Tech Stack
- **Backend**: Node.js, Express, JWT, bcrypt
- **Frontend**: React.js, Vite, Chart.js
- **Database**: JSON files (simulates MongoDB — swap easily)
- **Cache**: In-memory Map (simulates Redis)
