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

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

app.use(errorHandler);

initDatabase();
app.listen(PORT, () => {
  console.log(`CMS server running on http://localhost:${PORT}`);
});
