const db = require('../config/database');

exports.getMaterials = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM jadwal_materi_eeg WHERE status = 1');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching materials:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const { materiId } = req.query;
        if (!materiId) {
            return res.json({ success: true, data: { presensiCount: 0, assessmentCount: 0 } });
        }

        const [presensiRows] = await db.query(`
            SELECT k.nama 
            FROM absen_leg ab 
            RIGHT JOIN kelompok k ON k.id = ab.id_kelompok AND materi = ? 
            WHERE ab.id_kelompok IS NULL 
            GROUP BY k.nama
        `, [materiId]);

        const [assessmentRows] = await db.query(`
            SELECT k.nama
            FROM kelompok k
            LEFT JOIN astor a ON k.id = a.id_kelompok
            LEFT JOIN assessment_leg al ON al.nrp = a.nrp AND al.materi = ?
            WHERE al.id IS NULL
            GROUP BY k.nama
        `, [materiId]);

        res.json({ 
            success: true, 
            data: { 
                presensiCount: presensiRows.length, 
                assessmentCount: assessmentRows.length 
            } 
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPresensi = async (req, res) => {
    try {
        const { materiId } = req.params;
        const [rows] = await db.query(`
            SELECT k.nama 
            FROM absen_leg ab 
            RIGHT JOIN kelompok k ON k.id = ab.id_kelompok AND materi = ? 
            WHERE ab.id_kelompok IS NULL 
            GROUP BY k.nama
        `, [materiId]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching presensi:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAssessment = async (req, res) => {
    try {
        const { materiId } = req.params;
        const [rows] = await db.query(`
            SELECT k.nama
            FROM kelompok k
            LEFT JOIN astor a ON k.id = a.id_kelompok
            LEFT JOIN assessment_leg al ON al.nrp = a.nrp AND al.materi = ?
            WHERE al.id IS NULL
            GROUP BY k.nama
        `, [materiId]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching assessment:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
