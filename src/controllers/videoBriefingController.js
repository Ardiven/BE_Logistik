const { google } = require('googleapis');
const path = require('path');
const db = require('../config/database');

const formatSecondsToHHMMSS = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-';
    const num = Number(seconds);
    const h = Math.floor(num / 3600).toString().padStart(2, '0');
    const m = Math.floor((num % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(num % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

exports.getVideoBriefingProgress = async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../../service-account-credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1JwUQ3WxAPCSV_LXz2-6RYBM_wftdOoJnSAZF0PdPL3I';

        const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = sheetMetadata.data.sheets.find(s => s.properties.sheetId === 871330183) || sheetMetadata.data.sheets[0];
        const sheetName = sheet.properties.title;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found in Google Sheet.' });
        }

        const headers = rows[0].map(h => h.trim());
        const nrpIndex = headers.findIndex(h => h.toLowerCase() === 'nrp');
        const namaIndex = headers.findIndex(h => h.toLowerCase() === 'nama' || h.toLowerCase() === 'name');

        const legColumns = [];
        headers.forEach((header, index) => {
            if (/^(leg\s*)?\d+$/i.test(header) || !isNaN(header)) {
                const legNumber = header.replace(/\D/g, '');
                if (legNumber) {
                    legColumns.push({ index, leg: parseInt(legNumber) });
                }
            }
        });

        if (nrpIndex === -1 || namaIndex === -1) {
            return res.status(400).json({ message: 'Could not find NRP or Nama columns in the sheet.' });
        }

        const sheetUsers = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const nrp = row[nrpIndex];
            const nama = row[namaIndex];
            if (nrp && nama) {
                const userObj = { nrp: nrp.toString().trim(), nama: nama.trim() };
                legColumns.forEach(lc => {
                    userObj[`leg_${lc.leg}`] = row[lc.index] ? row[lc.index].toString().trim().toLowerCase() : '';
                });
                sheetUsers.push(userObj);
            }
        }

        const [activeMateris] = await db.query(
            'SELECT id FROM jadwal_materi_eeg WHERE status = 1'
        );
        const activeLegIds = activeMateris.map(m => m.id);

        const [progressRecords] = await db.query(
            'SELECT nrp, materi, posisi_terakhir, real_watch FROM progress_briefing'
        );

        const progressMap = {};
        progressRecords.forEach(record => {
            console.log("=== MASUK SEBELUM PROGRESS MAP ===");
            console.log("record:", record);

            console.log("NRP:", record?.nrp);
            console.log("MATERI:", record?.materi);

            if (!progressMap[record.nrp]) {
                progressMap[record.nrp] = {};
            }
            console.log(record);
            progressMap[record.nrp][record.materi] = {
                posisi_terakhir: record.posisi_terakhir,
                real_watch: record.real_watch
            };
            console.log(progressMap[record.nrp]);
        });

        const resultList = [];
        sheetUsers.forEach(user => {
            const userProgress = progressMap[user.nrp] || {};
            const legStatuses = {};

            const legsToCheck = legColumns.length > 0 ? legColumns.map(lc => lc.leg).filter(leg => activeLegIds.includes(leg)) : activeLegIds;

            legsToCheck.forEach(leg => {
                const legSheetStatus = user[`leg_${leg}`];
                const legProgress = userProgress[leg];
                let status = '-';
                let posisi = legProgress?.posisi_terakhir ? legProgress?.posisi_terakhir : '-';
                let watch = '-';

                // user says: ga datang = data di sheetnya berupa false
                if (legSheetStatus === 'false') {
                    if (!legProgress) {
                        status = 'Not Watched';
                    } else {
                        status = 'Watched';
                        posisi = formatSecondsToHHMMSS(legProgress.posisi_terakhir);
                        watch = formatSecondsToHHMMSS(legProgress.real_watch);
                    }
                } else if (legSheetStatus === 'true') {
                    status = 'Hadir';
                } else {
                    status = legSheetStatus || '-';
                }

                legStatuses[`Briefing LEG ${leg}`] = {
                    status,
                    posisi_terakhir: posisi,
                    real_watch: watch
                };
            });

            resultList.push({
                nrp: user.nrp,
                nama: user.nama,
                ...legStatuses
            });
        });

        res.json({
            success: true,
            columns: legColumns.filter(lc => activeLegIds.includes(lc.leg)).map(lc => `Briefing LEG ${lc.leg}`),
            data: resultList
        });

    } catch (error) {
        console.error('Error fetching video briefing progress:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};
