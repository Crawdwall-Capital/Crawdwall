import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables with override
dotenv.config({ override: true });

// Create a connection pool for PostgreSQL with SSL enabled for Render
const connectionString = process.env.DATABASE_URL;

console.log('DATABASE_URL:', connectionString ? connectionString.substring(0, 30) + '...' : 'NOT SET');

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse connection string to extract components
const dbUrl = new URL(connectionString);

const poolId = Math.random().toString(36).substring(7);
console.log(`Creating pool ${poolId} with config:`, {
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  passwordLength: dbUrl.password.length,
  ssl: 'enabled'
});

const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: dbUrl.password,
  ssl: {
    rejectUnauthorized: false  // Accept self-signed certificates for Render
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test the pool connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  }
})();

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
});

export default pool;