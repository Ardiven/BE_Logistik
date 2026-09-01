const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    console.log('Starting database migration...');
    try {
        // First connection without database selected to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_NAME;
        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.end();

        // Second connection to the specific database
        const pool = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName,
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, '..', 'init-db.sql');
        console.log(`Reading SQL from ${sqlPath}...`);
        let sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL script...');
        await pool.query(sql);

        console.log('Migration completed successfully!');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
