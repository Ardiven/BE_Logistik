const cron = require('node-cron');
const db = require('../config/database');
const emailService = require('./emailService');

const startCron = () => {
    // Schedule SLA 24h check every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running SLA 24h check cron job...');
        try {
            // Find requests that are PROSES and updated > 24 hours ago and haven't been notified
            const [delayedRequests] = await db.query(`
                SELECT id, ticket_code, group_id, processed_by_nrp
                FROM room_requests 
                WHERE status = 'PROSES' 
                AND updated_at < NOW() - INTERVAL 24 HOUR
                AND sla_notified = FALSE
            `);

            if (delayedRequests.length > 0) {
                // Get BPH and BPHK emails from office bidang and logistik tim
                const [bphAdmins] = await db.query("SELECT nrp FROM data_tim WHERE (role = 'BPH' AND bidang = 'office') OR (role = 'BPHK' AND tim = 'logistik')");
                if (bphAdmins.length > 0) {
                    for (const req of delayedRequests) {
                        const subject = `Peringatan SLA: Tiket ${req.ticket_code} Tertunda`;
                        const html = `
                            <p>Halo BPH/BPHK,</p>
                            <p>Tiket peminjaman <b>${req.ticket_code}</b> (KTB ${req.group_id}) telah diproses oleh <b>${req.processed_by_nrp || 'Panitia'}</b> selama lebih dari 24 jam namun belum di-assign atau ditolak.</p>
                            <p>Mohon untuk segera ditindaklanjuti.</p>
                        `;
                        
                        for (const admin of bphAdmins) {
                            const email = `${admin.nrp}@john.petra.ac.id`;
                            try {
                                await emailService.sendEmail(email, subject, html);
                            } catch (e) {
                                console.error(`Failed to send SLA email to ${email}:`, e.message);
                            }
                        }
                        
                        // Mark as notified
                        await db.query('UPDATE room_requests SET sla_notified = TRUE WHERE id = ?', [req.id]);
                    }
                }
            }
        } catch (err) {
            console.error('Error in SLA cron job:', err.message);
        }
    });

    // Schedule task to run every Friday at 08:00 AM
    cron.schedule('0 8 * * 5', async () => {
        console.log('Running Friday email reminder cron job...');
        try {
            // Get email template from settings
            const [settingsRows] = await db.query('SELECT * FROM settings WHERE setting_key IN ("FRIDAY_EMAIL_SUBJECT", "FRIDAY_EMAIL_HTML", "IS_FRIDAY_EMAIL_ENABLED", "FRIDAY_EMAIL_DISABLED_AT")');
            let emailSubject = 'Reminder: Peminjaman Ruangan untuk Logistik';
            let isEnabled = true;
            let disabledAt = 0;
            let emailHtmlTemplate = `
                <p>Halo {{nama}},</p>
                <p>Ini adalah pengingat otomatis bagi Ketua Kelompok yang biasanya meminjam ruangan.</p>
                <p>Mohon pastikan untuk melakukan peminjaman ruangan jika diperlukan, agar tidak lupa.</p>
                <br/>
                <p>Terima kasih,</p>
                <p>Sistem Logistik TPS</p>
            `;
            
            for (const row of settingsRows) {
                if (row.setting_key === 'FRIDAY_EMAIL_SUBJECT') emailSubject = row.setting_value;
                if (row.setting_key === 'FRIDAY_EMAIL_HTML') emailHtmlTemplate = row.setting_value;
                if (row.setting_key === 'IS_FRIDAY_EMAIL_ENABLED') isEnabled = row.setting_value === 'true';
                if (row.setting_key === 'FRIDAY_EMAIL_DISABLED_AT') disabledAt = parseInt(row.setting_value) || 0;
            }

            if (!isEnabled) {
                const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - disabledAt > oneWeekMs) {
                    console.log('7 days have passed since disabled. Auto-resetting to enabled.');
                    await db.query(`UPDATE settings SET setting_value = 'true' WHERE setting_key = 'IS_FRIDAY_EMAIL_ENABLED'`);
                    isEnabled = true;
                } else {
                    console.log('Friday email is disabled (under 7-day pause). Skipping.');
                    return;
                }
            }

            // Get all ketua_kelompok
            const [leaders] = await db.query(`
                SELECT k.nrp, a.nama 
                FROM ketua_kelompok k 
                LEFT JOIN astor a ON k.nrp = a.nrp
            `);
            
            for (const leader of leaders) {
                const email = `${leader.nrp}@john.petra.ac.id`;
                const leaderName = leader.nama || leader.nrp;
                
                // Replace placeholders
                const html = emailHtmlTemplate.replace(/\{\{nama\}\}/g, leaderName);

                try {
                    await emailService.sendEmail(email, emailSubject, html);
                    console.log(`Sent reminder email to ${email}`);
                } catch (emailErr) {
                    console.error(`Failed to send reminder to ${email}:`, emailErr.message);
                }
            }
        } catch (err) {
            console.error('Error in Friday email reminder cron job:', err.message);
        }
    });

    // H-3 Booking Reminder for BPHK Logistik (Runs daily at 09:00 AM)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running H-3 Booking Reminder cron job...');
        try {
            // Check if reminder is enabled for this week
            const [settingsRows] = await db.query('SELECT * FROM settings WHERE setting_key IN ("IS_FRIDAY_EMAIL_ENABLED", "FRIDAY_EMAIL_DISABLED_AT")');
            let isEnabled = true;
            let disabledAt = 0;
            for (const row of settingsRows) {
                if (row.setting_key === 'IS_FRIDAY_EMAIL_ENABLED') isEnabled = row.setting_value === 'true';
                if (row.setting_key === 'FRIDAY_EMAIL_DISABLED_AT') disabledAt = parseInt(row.setting_value) || 0;
            }

            if (!isEnabled) {
                const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - disabledAt > oneWeekMs) {
                    console.log('7 days have passed since disabled. Auto-resetting to enabled.');
                    await db.query(`UPDATE settings SET setting_value = 'true' WHERE setting_key = 'IS_FRIDAY_EMAIL_ENABLED'`);
                    isEnabled = true;
                } else {
                    console.log('Reminder is disabled (under 7-day pause). Skipping H-3 reminder.');
                    return;
                }
            }

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 3);
            const targetDateString = targetDate.toISOString().split('T')[0];
            
            // In JS: 0 = Sun, 1 = Mon ... 6 = Sat
            // In App: 1 = Mon, 2 = Tue ... 7 = Sun
            let jsDay = targetDate.getDay();
            let appDay = jsDay === 0 ? 7 : jsDay;

            // Find KTBs that have a schedule on appDay
            const [jadwalRows] = await db.query('SELECT id_mentor FROM jadwal WHERE hari = ?', [appDay]);
            
            if (jadwalRows.length === 0) return;

            const ktbIds = jadwalRows.map(r => r.id_mentor);
            
            // Check room_requests for these KTBs on targetDate
            const [bookedRequests] = await db.query(`
                SELECT group_id FROM room_requests 
                WHERE requested_date = ? AND group_id IN (?)
            `, [targetDateString, ktbIds]);
            
            const bookedGroupIds = bookedRequests.map(r => Number(r.group_id));
            const unbookedGroupIds = ktbIds.filter(id => !bookedGroupIds.includes(Number(id)));

            if (unbookedGroupIds.length > 0) {
                // Fetch BPHK Logistik
                const [bphkAdmins] = await db.query("SELECT nrp FROM data_tim WHERE role = 'BPHK' AND tim = 'logistik'");
                if (bphkAdmins.length > 0) {
                    const subject = 'Peringatan H-3: Terdapat KTB yang Belum Meminjam Ruangan';
                    let htmlList = unbookedGroupIds.map(id => `<li>KTB ${id}</li>`).join('');
                    const html = `
                        <p>Halo BPHK Logistik,</p>
                        <p>Berikut adalah daftar kelompok KTB yang memiliki jadwal pada <b>${targetDateString}</b> (H-3), namun sampai saat ini <b>belum</b> mengajukan tiket peminjaman ruangan:</p>
                        <ul>${htmlList}</ul>
                        <p>Mohon untuk segera menagih ketua kelompok yang bersangkutan, karena hari ini adalah batas terakhir peminjaman.</p>
                        <br/>
                        <p>Sistem Logistik TPS</p>
                    `;

                    for (const admin of bphkAdmins) {
                        const email = `${admin.nrp}@john.petra.ac.id`;
                        try {
                            await emailService.sendEmail(email, subject, html);
                        } catch (e) {
                            console.error(`Failed to send H-4 email to ${email}:`, e.message);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in H-4 Reminder cron job:', err.message);
        }
    });
};

module.exports = { startCron };
