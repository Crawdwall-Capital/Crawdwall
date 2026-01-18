import pool from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

/**
 * CREATE OFFICER (by Admin)
 */
export const createOfficer = async ({ email, name, password, createdBy }) => {
    // 1. Normalize email
    const normalizedEmail = email.toLowerCase();

    // 2. Check if officer email already exists
    const existingOfficer = await pool.query(
        'SELECT id FROM "Officer" WHERE email = $1',
        [normalizedEmail]
    );

    if (existingOfficer.rows.length > 0) {
        throw new Error('Officer email already exists');
    }

    // 3. Check if email exists in User table
    const existingUser = await pool.query(
        'SELECT id FROM "User" WHERE email = $1',
        [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
        throw new Error('Email already registered as user');
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create officer
    const officerId = uuidv4();
    const result = await pool.query(
        `INSERT INTO "Officer" (id, email, name, password, status, "createdBy", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ACTIVE', $5, NOW(), NOW())
     RETURNING id, email, name, status, "createdAt"`,
        [officerId, normalizedEmail, name, hashedPassword, createdBy]
    );

    return result.rows[0];
};

/**
 * OFFICER LOGIN
 */
export const loginOfficer = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();

    // 1. Find officer
    const result = await pool.query(
        'SELECT id, email, name, password, status FROM "Officer" WHERE email = $1',
        [normalizedEmail]
    );

    if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
    }

    const officer = result.rows[0];

    // 2. Check if officer is active
    if (officer.status !== 'ACTIVE') {
        throw new Error('Officer account is suspended');
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    return {
        id: officer.id,
        email: officer.email,
        name: officer.name,
        role: 'OFFICER'
    };
};

/**
 * GET ALL OFFICERS (for Admin)
 */
export const getAllOfficers = async () => {
    const result = await pool.query(
        `SELECT id, email, name, status, "createdBy", "createdAt", "updatedAt"
     FROM "Officer"
     ORDER BY "createdAt" DESC`
    );

    return result.rows;
};

/**
 * GET OFFICER BY ID
 */
export const getOfficerById = async (officerId) => {
    const result = await pool.query(
        `SELECT id, email, name, status, "createdBy", "createdAt", "updatedAt"
     FROM "Officer"
     WHERE id = $1`,
        [officerId]
    );

    if (result.rows.length === 0) {
        throw new Error('Officer not found');
    }

    return result.rows[0];
};

/**
 * UPDATE OFFICER STATUS (by Admin)
 */
export const updateOfficerStatus = async (officerId, status) => {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

    if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
    }

    const result = await pool.query(
        `UPDATE "Officer" 
     SET status = $1, "updatedAt" = NOW()
     WHERE id = $2
     RETURNING id, email, name, status, "updatedAt"`,
        [status, officerId]
    );

    if (result.rows.length === 0) {
        throw new Error('Officer not found');
    }

    return result.rows[0];
};

/**
 * DELETE OFFICER (by Admin)
 */
export const deleteOfficer = async (officerId) => {
    const result = await pool.query(
        'DELETE FROM "Officer" WHERE id = $1 RETURNING id, email, name',
        [officerId]
    );

    if (result.rows.length === 0) {
        throw new Error('Officer not found');
    }

    return result.rows[0];
};

/**
 * UPDATE OFFICER PASSWORD
 */
export const updateOfficerPassword = async (officerId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await pool.query(
        `UPDATE "Officer" 
     SET password = $1, "updatedAt" = NOW()
     WHERE id = $2
     RETURNING id, email, name`,
        [hashedPassword, officerId]
    );

    if (result.rows.length === 0) {
        throw new Error('Officer not found');
    }

    return result.rows[0];
};