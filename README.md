# Mock Placement Platform

A coding assessment platform for college placement practice, now being migrated to a React + Express + PostgreSQL stack.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Code execution: Judge0 CE API

## Project Layout

- `backend/` - Express API and PostgreSQL schema/bootstrap
- `client/` - React app and Vite build
- `frontend/` - Legacy static HTML version kept during migration

## Setup

### 1. Install PostgreSQL

Create a database named `mock_placement` or update `DATABASE_URL` to match your local setup.

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and update values if needed.

### 3. Install dependencies

```bash
cd backend
npm install

cd ../client
npm install
```

### 4. Start the backend

```bash
cd backend
npm run dev
```

### 5. Start the React client

```bash
cd client
npm run dev
```

Open the client at the Vite URL shown in the terminal, usually `http://localhost:5173`.


## Demo Data

Seed the sample placement test after PostgreSQL is ready:

```bash
cd backend
node seed-demo.js
```
