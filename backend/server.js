const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const clientDist = path.join(__dirname, '../client/dist');
const legacyFrontend = path.join(__dirname, '../frontend');
const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));
const staticDir = hasClientBuild ? clientDist : legacyFrontend;

// Serve frontend assets
app.use(express.static(staticDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Global error handler — return JSON for API errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  next(err);
});

// Fallback to frontend (non-API routes only)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  }

  const indexFile = hasClientBuild
    ? path.join(clientDist, 'index.html')
    : path.join(legacyFrontend, 'index.html');

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.status(404).send('Frontend not built yet. Start the React client or build it first.');
});

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
