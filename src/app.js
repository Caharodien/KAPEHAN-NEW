const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Built-in body parser

// Routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Ensure that the routes are functions
if (typeof menuRoutes === 'function' && typeof orderRoutes === 'function') {
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
} else {
  console.error('Routes are not correctly exported as functions');
}

// Root test route
app.get('/', (req, res) => {
  res.send('Coffee Shop API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
