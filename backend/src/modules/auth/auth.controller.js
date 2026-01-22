
import * as authService from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { generateOTP, storeOTP, verifyOTP, isAdminEmail, authorizeAdminEmail } from './otp.service.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export const register = async (req, res, next) => {
  try {
    console.log('Register endpoint hit');
    console.log('Request body:', req.body);

    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    console.log('Validation passed, calling auth service...');
    const data = await authService.register(value);
    console.log('Registration successful');
    res.status(201).json(data);
  } catch (err) {
    console.error('Registration error:', err);
    next(err);
  }
};


export const login = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const data = await authService.login(value);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};


export const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};


export const logout = async (req, res, next) => {
  try {
    // In a real implementation, you might want to add the token to a blacklist
    // or store it in a cache to prevent reuse until expiration
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};


export const requestAdminOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Admin email is required' });
    }

    // Check if the email is the authorized admin email
    if (!isAdminEmail(email)) {
      return res.status(400).json({ message: 'Only authorized admin can request OTP' });
    }

    // Authorize the admin email in the database
    try {
      await authorizeAdminEmail(email, email);
    } catch (authError) {
      console.error('Error authorizing admin email:', authError);
      return res.status(500).json({ message: 'Failed to authorize admin email' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP for the admin email
    await storeOTP(email, otp);

    // Create a transporter for sending email
    // In a real application, configure this with your email service provider
    const transporter = nodemailer.createTransport({
      // Use environment variables for email configuration
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      // Add timeout and connection options for Render
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // TLS options
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send OTP via email to the target admin
    try {
      console.log('Attempting to send OTP email...');
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        passLength: process.env.SMTP_PASS?.length
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER || '"Crawdwall Admin" <admin@yourdomain.com>',
        to: email,  // Send to the admin email
        subject: 'Admin Login OTP - Crawdwall Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Admin Login OTP</h2>
            <p>Hello Admin,</p>
            <p>You have been granted admin access to Crawdwall Platform.</p>
            <p>Your OTP for admin login is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please contact the super admin.</p>
            <br />
            <p>Best regards,<br />The Crawdwall Team</p>
          </div>
        `
      });

      console.log('OTP email sent successfully');
      res.status(200).json({
        message: 'OTP sent successfully to admin email',
        adminEmail: email
      });
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
      console.error('Email error details:', emailErr.message);
      // For security reasons, still return success message to prevent enumeration
      res.status(200).json({
        message: 'OTP generated and stored, but failed to send email. Contact admin if admin doesn\'t receive it.',
        adminEmail: email
      });
    }
  } catch (err) {
    next(err);
  }
};


export const addAdminUser = async (req, res, next) => {
  try {
    const { superAdminEmail, adminEmail, adminName } = req.body;

    if (!superAdminEmail || !adminEmail) {
      return res.status(400).json({ message: 'Super admin email and admin email are required' });
    }

    // Check if the request is coming from the admin
    if (!isAdminEmail(superAdminEmail)) {
      return res.status(400).json({ message: 'Only admin can add other admin users' });
    }

    // Authorize the admin email in the database
    const result = await authorizeAdminEmail(superAdminEmail, adminEmail, adminName);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


export const verifyAdminOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Verify OTP
    const verificationResult = await verifyOTP(email, otp);

    if (verificationResult.valid) {
      // OTP is valid, create a JWT for the admin
      const token = jwt.sign(
        { userId: email, role: 'ADMIN' }, // Use email as identifier
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        role: 'ADMIN'
      });
    } else {
      res.status(400).json({ message: verificationResult.message });
    }
  } catch (err) {
    next(err);
  }
};


