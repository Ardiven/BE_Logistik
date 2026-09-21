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

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

exports.exportToSheets = async (req, res) => {
    try {
        const { type } = req.body;
        if (!type || !['absen', 'assessment', 'both'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Tipe export tidak valid.' });
        }

        // 1. Get spreadsheet ID from settings
        const [settingsRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'GOOGLE_SHEETS_ID'");
        if (settingsRows.length === 0 || !settingsRows[0].setting_value) {
            return res.status(400).json({ success: false, error: 'Google Sheets ID belum dikonfigurasi di Pengaturan Sistem.' });
        }
        const spreadsheetId = settingsRows[0].setting_value;

        // 2. Load credentials from service-account-credentials.json
        const keyFilePath = path.join(__dirname, '../../service-account-credentials.json');
        if (!fs.existsSync(keyFilePath)) {
            return res.status(500).json({ success: false, error: 'File service-account-credentials.json tidak ditemukan.' });
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 3. Helper to upload data
        const uploadData = async (sheetName, data) => {
            if (data.length === 0) return;
            const headers = Object.keys(data[0]);
            const rows = data.map(row => headers.map(header => row[header] === null || row[header] === undefined ? '' : String(row[header])));
            const values = [headers, ...rows];

            try {
                // Clear existing data
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: `'${sheetName}'!A:Z`
                });
            } catch (e) {
                console.log(`Failed to clear sheet ${sheetName}, ignoring...`);
            }

            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'${sheetName}'!A1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values }
                });
            } catch (e) {
                console.error(`Failed to upload to sheet ${sheetName}:`, e);
                throw new Error(`Gagal upload ke sheet ${sheetName} (Pastikan Service Account memiliki akses Editor ke Spreadsheet): ${e.message}`);
            }
        };

        if (type === 'absen' || type === 'both') {
            const [absenData] = await db.query(`
                SELECT m.nama AS 'Nama Maba', a.nrp_maba AS 'NRP', a.id_kelompok AS 'Kelompok', a.status AS 'Status', a.\`keaktifan maba\` AS 'Keaktifan', refleksi_maba
                FROM absen_leg a
                LEFT JOIN maba m ON a.nrp_maba = m.nrp
            `);
            await uploadData('Absen', absenData);
        }

        if (type === 'assessment' || type === 'both') {
            const [assessmentData] = await db.query('SELECT * FROM assessment_leg');
            await uploadData('Assessment', assessmentData);
        }

        res.json({ success: true, message: 'Data berhasil diekspor ke Google Sheets.' });
    } catch (err) {
        console.error('Error exporting to sheets:', err);
        res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
};
