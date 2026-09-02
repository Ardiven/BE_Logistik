const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Adding assigned_by_name to room_requests...');
        try {
            await db.query('ALTER TABLE room_requests ADD COLUMN assigned_by_name VARCHAR(100) NULL');
            console.log('Column assigned_by_name added. ');
        } catch (e) {
            console.log('Column assigned_by_name may already exist or error:', e.message);
        }

        console.log('Adding password to admin...');
        try {
            await db.query('ALTER TABLE admin ADD COLUMN password VARCHAR(255) NULL');
            console.log('Column password added to admin.');
        } catch (e) {
            console.log('Column password may already exist or error:', e.message);
        }

        console.log('Adding password to astor...');
        try {
            await db.query('ALTER TABLE astor ADD COLUMN password VARCHAR(255) NULL');
            console.log('Column password added to astor.');
        } catch (e) {
            console.log('Column password may already exist or error:', e.message);
        }

        console.log('Inserting default admin for logistik...');
        try {
            // nrp: logistik1, bidang: logistik, password: password
            await db.query(`INSERT INTO admin (nrp, bidang, password) VALUES ('logistik1', 'logistik', 'password')`);
            console.log('Default admin inserted.');
        } catch (e) {
            console.log('Admin insert error:', e.message);
        }

        console.log('Inserting default astor...');
        try {
            // nrp: astor1, nama: Astor 1, password: password
            await db.query(`INSERT INTO astor (nrp, nama, password) VALUES ('astor1', 'Astor 1', 'password')`);
            console.log('Default astor inserted.');
        } catch (e) {
            console.log('Astor insert error:', e.message);
        }

        console.log('Creating ketua_kelompok table...');
        try {
            await db.query(`CREATE TABLE IF NOT EXISTS ketua_kelompok (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nrp VARCHAR(50) NOT NULL UNIQUE,
                nama VARCHAR(255) NOT NULL
            )`);
            console.log('Table ketua_kelompok created.');
        } catch (e) {
            console.log('Error creating ketua_kelompok table:', e.message);
        }

        console.log('Creating mentor table...');
        try {
            await db.query(`CREATE TABLE IF NOT EXISTS mentor (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nrp VARCHAR(50) NOT NULL UNIQUE,
                nama VARCHAR(255) NOT NULL,
                password VARCHAR(255) NULL
            )`);
            console.log('Table mentor created.');
        } catch (e) {
            console.log('Error creating mentor table:', e.message);
        }

        console.log('Inserting default ketua_kelompok and mentor...');
        try {
            await db.query(`INSERT INTO ketua_kelompok (nrp, nama, password) VALUES ('ketua1', 'Ketua 1', 'password')`);
            await db.query(`INSERT INTO mentor (nrp, nama, password) VALUES ('mentor1', 'Mentor 1', 'password')`);
            console.log('Default ketua_kelompok and mentor inserted.');
        } catch (e) {
            console.log('Default data insert error:', e.message);
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        process.exit(0);
    }
}
migrate();
