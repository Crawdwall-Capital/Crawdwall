import pool from './src/config/prisma.js';
import fs from 'fs';

const runMigrations = async () => {
    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync('./create-tables.sql', 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Running migrations...');

        // Split SQL into individual statements and run them one by one
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            const trimmedStatement = statement.trim();
            if (trimmedStatement.length === 0) continue;

            try {
                await client.query(trimmedStatement);
                console.log('✓ Executed:', trimmedStatement.substring(0, 50) + '...');
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log('⚠ Skipped (already exists):', trimmedStatement.substring(0, 50) + '...');
                } else {
                    console.error('✗ Failed:', trimmedStatement.substring(0, 50) + '...');
                    throw error;
                }
            }
        }

        console.log('✓ Migrations completed successfully!');

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:');
        console.error('Error:', error.message);

        await pool.end();
        process.exit(1);
    }
};

runMigrations();
