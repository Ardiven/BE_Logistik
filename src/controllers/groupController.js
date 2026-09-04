const db = require('../config/database');

exports.getGroups = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, j.hari, j.waktu
            FROM mentor m
            LEFT JOIN jadwal j ON m.id = j.id_mentor
            ORDER BY m.nama ASC
        `);
        const groups = rows.map(r => ({
            id: r.id,
            groupNumber: r.id, // Using id as group number
            groupName: r.nama,
            defaultMentorName: r.nama,
            defaultContact: r.line || '',
            defaultEmail: r.email || '',
            defaultDay: r.hari,
            defaultTime: r.waktu
        }));
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};
