require('dotenv').config();
const express = require('express');
const path = require('path');
const tokenRoutes = require('../routes/api/token');
const hyperliquidRoutes = require('../routes/api/hyperliquid');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../dist')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/token', tokenRoutes);
app.use('/api/hyperliquid', hyperliquidRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

module.exports = app;

