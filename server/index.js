/**
 * Server entry point.
 * Loads environment variables, configures Express middleware,
 * mounts the admin and content route groups, and starts
 * listening once the SQLite database is ready.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase } = require('./src/config/database');
const adminRoutes = require('./src/routes/admin');
const contentRoutes = require('./src/routes/content');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware: allow cross-origin requests, log HTTP requests, parse JSON bodies
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Route groups: admin manages collection schemas, content manages entries
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

// Global error handler — must be registered last so it catches errors from all routes
app.use(errorHandler);

// Initialize the database (async because sql.js loads WASM), then start the server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`CMS server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
