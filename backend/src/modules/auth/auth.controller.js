import * as authService from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { generateOTP, storeOTP, verifyOTP, isAdminEmail, authorizeAdminEmail } from './otp.service.js';
import sgMail from '@sendgrid/mail';
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
        // Handle ADMIN role differently (they don't exist in User table)
        if (req.user.role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                data: {
                    id: 'admin',
                    name: 'Platform Administrator',
                    email: req.user.userId, // For admin, userId is the email
                    role: 'ADMIN',
                    createdAt: new Date().toISOString()
                }
            });
        }

        // For regular users (ORGANIZER/INVESTOR)
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

        // Send OTP via SendGrid API (NOT SMTP - APIs work on Render!)
        try {
            console.log('Sending OTP via SendGrid API...');

            // Set SendGrid API key
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            const msg = {
                to: email,
                from: 'crawdwallcapital@gmail.com', // Verified sender email
                subject: 'Admin Login OTP - Crawdwall Platform',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Admin Login OTP</h2>
            <p>Hello Admin,</p>
            <p>You have been granted admin access to Crawdwall Platform.</p>
            <p>Your OTP for admin login is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please contact support.</p>
            <br />
            <p>Best regards,<br />The Crawdwall Team</p>
          </div>
        `
            };

            const response = await sgMail.send(msg);
            console.log('SendGrid response:', response[0]?.statusCode);
            console.log('OTP email sent successfully via SendGrid API');

            res.status(200).json({
                message: 'OTP sent successfully to admin email',
                adminEmail: email
            });
        } catch (emailErr) {
            console.error('Failed to send email via SendGrid API:', emailErr);
            console.error('Email error details:', emailErr.message);

            // TEMPORARY: Return OTP in response as fallback
            res.status(200).json({
                message: 'Email service error. Use the OTP below to login.',
                adminEmail: email,
                temporaryOTP: otp,
                note: 'This OTP is valid for 10 minutes. Please check SendGrid configuration.'
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