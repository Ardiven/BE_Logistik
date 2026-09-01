const db = require('../config/database');

exports.getGroups = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mentor ORDER BY nama ASC');
        const groups = rows.map(r => ({
            id: r.id,
            groupNumber: r.id, // Using id as group number
            groupName: r.nama,
            defaultLeaderName: r.nama,
            defaultContact: r.line || '',
            defaultEmail: r.email || ''
        }));
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};
