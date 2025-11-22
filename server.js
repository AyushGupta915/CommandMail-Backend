const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local development
    'http://localhost:3000', // Alternative local
    'https://your-app-name.vercel.app', // Replace with your Vercel domain
    'https://*.vercel.app', // All Vercel preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/emails', require('./routes/emails'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/drafts', require('./routes/drafts'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email Productivity Agent API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      emails: '/api/emails',
      prompts: '/api/prompts',
      agent: '/api/agent',
      drafts: '/api/drafts'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});