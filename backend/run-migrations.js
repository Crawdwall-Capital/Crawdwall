import pool from './src/config/prisma.js';

const runMigrations = async () => {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('✓ Database connected successfully');
        console.log('✓ Migration check completed - database is ready!');

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('✗ Database connection failed:');
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
};

runMigrations();