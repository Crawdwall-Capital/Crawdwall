import express from 'express';
import { register, login, me, logout, requestAdminOTP, verifyAdminOTP, addAdminUser } from './auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';


const router = express.Router();

// General registration
router.post('/register', register);

// Organizer-specific registration
router.post('/organizer/register', (req, res, next) => {
  // Set the role to ORGANIZER by default for this endpoint
  req.body.role = 'ORGANIZER';
  register(req, res, next);
});

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

// Admin OTP routes
router.post('/admin/request-otp', requestAdminOTP);
router.post('/admin/verify-otp', verifyAdminOTP);
router.post('/admin/add-admin', addAdminUser);


export default router;
