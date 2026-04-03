const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const evaluateRoutes = require('./routes/evaluate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', evaluateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Error interno del servidor',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// Start server only si no estamos en Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║     Buyer Persona - Servidor iniciado               ║
║     Puerto: ${PORT}                                      ║
║     URL: http://localhost:${PORT}                         ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
