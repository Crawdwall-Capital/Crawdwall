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

dotenv.config({ override: true });

const app = express();

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Define allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173', // Vite default
            'http://localhost:4173', // Vite preview
            'https://frontend-crawdwall-capital.vercel.app', // Your Vercel frontend
            'https://crawdwall-frontend.onrender.com', // Alternative Render frontend
            'https://crawdwall.com', // Custom domain if you have one
            process.env.FRONTEND_URL // Environment variable for frontend URL
        ].filter(Boolean); // Remove undefined values

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-File-Name'
    ],
    exposedHeaders: ['Content-Disposition'], // For file downloads
    maxAge: 86400 // Cache preflight for 24 hours
};

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with configuration
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizer/proposals', organizerRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (OTP login, officer management)
app.use('/api/officer', officerRoutes); // Officer routes (login, proposal review)
app.use('/api/investor', investorRoutes);

// Serve uploaded files (for document downloads)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
    res.status(200).json({
        message: 'CORS is working!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString(),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    });
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