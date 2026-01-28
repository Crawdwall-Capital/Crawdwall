import pool from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const ALLOWED_SIGNUP_TYPES = ['ORGANIZER', 'INVESTOR', 'ADMIN'];

/**
 * GET CURRENT USER
 */
export const getMe = async (userId) => {
  console.log('=== getMe service debug ===');
  console.log('Looking for userId:', userId);
  console.log('userId type:', typeof userId);

  const result = await pool.query(
    'SELECT id, name, email, "phoneNumber", role, "createdAt" FROM "User" WHERE id = $1',
    [userId]
  );

  console.log('Query result rows:', result.rows.length);
  if (result.rows.length > 0) {
    console.log('Found user:', result.rows[0].email);
  }

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * REGISTER USER
 */
export const register = async ({ name, email, phoneNumber, password, role }) => {
  // 1. Validate role type
  if (!ALLOWED_SIGNUP_TYPES.includes(role)) {
    throw new Error('Invalid role type');
  }

  // 2. Normalize email
  const normalizedEmail = email.toLowerCase();

  console.log('Checking for existing user...');

  // 3. Check email uniqueness
  try {
    const existingUser = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [normalizedEmail]
    );

    console.log('Existing user check complete:', existingUser.rows.length);

    if (existingUser.rows.length > 0) {
      throw new Error('Email already in use');
    }
  } catch (error) {
    console.error('Error checking existing user:', error);
    throw error;
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  console.log('Creating new user...');

  // 5. Create user
  try {
    const result = await pool.query(
      `INSERT INTO "User" (id, name, email, "phoneNumber", password, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, role`,
      [name, normalizedEmail, phoneNumber, hashedPassword, role]
    );

    const user = result.rows[0];
    console.log('User created successfully:', user.id);

    // 6. Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      message: 'Registration successful',
      token,
      role: user.role
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * LOGIN USER
 */
export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const result = await pool.query(
    'SELECT id, email, password, role FROM "User" WHERE email = $1',
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    message: 'Login successful',
    token,
    role: user.role
  };
};
