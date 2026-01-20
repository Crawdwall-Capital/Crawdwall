import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import organizerRoutes from './modules/proposal/organizer.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import officerRoutes from './modules/officer/officer.routes.js';
import investorRoutes from './modules/investor/investor.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';

dotenv.config({ override: true });

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizer/proposals', organizerRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (OTP login, officer management)
app.use('/api/officer', officerRoutes); // Officer routes (login, proposal review)
app.use('/api/investor', investorRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Test endpoint
app.post('/test-register', (req, res) => {
  console.log('Test register endpoint hit!');
  console.log('Body:', req.body);
  res.status(200).json({ message: 'Test successful', body: req.body });
});

console.log('Test endpoint registered at POST /test-register');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR MIDDLEWARE ===');
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('=======================');

  res.status(500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
