const db = require('../config/database');

exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(r => {
            settings[r.setting_key] = r.setting_value;
        });
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Failed to get settings:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    const settingsObj = req.body; // e.g. { FRIDAY_EMAIL_SUBJECT: '...', FRIDAY_EMAIL_HTML: '...' }
    const teamRole = req.user ? req.user.teamRole : null;

    if (teamRole === 'Anggota') {
        return res.status(403).json({ success: false, error: 'Akses ditolak. Hanya BPH dan BPHK yang dapat mengubah pengaturan.' });
    }

    try {
        if (settingsObj.IS_FRIDAY_EMAIL_ENABLED === 'false') {
            const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "IS_FRIDAY_EMAIL_ENABLED"');
            if (!rows.length || rows[0].setting_value === 'true') {
                settingsObj.FRIDAY_EMAIL_DISABLED_AT = Date.now().toString();
            }
        }

        for (const [key, value] of Object.entries(settingsObj)) {
            await db.query(`
                INSERT INTO settings (setting_key, setting_value) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `, [key, value]);
        }
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Failed to update settings:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};
