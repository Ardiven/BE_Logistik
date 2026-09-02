const cron = require('node-cron');
const db = require('../config/database');
const emailService = require('./emailService');

const startCron = () => {
    // Schedule task to run every Friday at 08:00 AM
    cron.schedule('0 8 * * 5', async () => {
        console.log('Running Friday email reminder cron job...');
        try {
            // Get all ketua_kelompok
            const [leaders] = await db.query('SELECT * FROM ketua_kelompok');
            
            for (const leader of leaders) {
                const email = `${leader.nrp}@john.petra.ac.id`;
                const subject = 'Reminder: Peminjaman Ruangan untuk Logistik';
                const html = `
                    <p>Halo ${leader.nama || leader.nrp},</p>
                    <p>Ini adalah pengingat otomatis bagi Ketua Kelompok yang biasanya meminjam ruangan.</p>
                    <p>Mohon pastikan untuk melakukan peminjaman ruangan jika diperlukan, agar tidak lupa.</p>
                    <br/>
                    <p>Terima kasih,</p>
                    <p>Sistem Logistik TPS</p>
                `;

                try {
                    await emailService.sendEmail(email, subject, html);
                    console.log(`Sent reminder email to ${email}`);
                } catch (emailErr) {
                    console.error(`Failed to send reminder to ${email}:`, emailErr.message);
                }
            }
        } catch (err) {
            console.error('Error in Friday email reminder cron job:', err.message);
        }
    });
};

module.exports = { startCron };
