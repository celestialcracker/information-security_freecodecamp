require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api');

const app = express();

// Security features
app.use(helmet.frameguard({ action: 'sameorigin' })); // Only allow your site to be loaded in an iFrame on your own pages
app.use(helmet.dnsPrefetchControl({ allow: false })); // Do not allow DNS prefetching
app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // Only allow your site to send the referrer for your own pages

// Basic middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: '*' })); // For development; restrict in production

// Connect to MongoDB
mongoose.connect(process.env.DB || 'mongodb://localhost:27017/anonymous-message-board')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Anonymous Message Board API');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing