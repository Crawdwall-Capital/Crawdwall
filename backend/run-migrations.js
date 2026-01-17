import pool from './src/config/prisma.js';
import fs from 'fs';

const runMigrations = async () => {
    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync('./create-tables.sql', 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Running migrations...');
        await client.query(sql);

        console.log('✓ Migrations completed successfully!');

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:');
        console.error('Error:', error.message);

        if (error.message.includes('already exists')) {
            console.log('\nTables might already exist. This is okay!');
        }

        await pool.end();
        process.exit(1);
    }
};

runMigrations();
