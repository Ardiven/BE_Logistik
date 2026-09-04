const db = require('../config/database');
const emailService = require('../services/emailService');

exports.createRequest = async (req, res) => {
    const { groupId, requestedDate, startTime, endTime } = req.body;
    const submittedByNrp = req.user ? req.user.nrp : null;

    try {
        // H-3 Validation
        const [[{ days_diff }]] = await db.query('SELECT DATEDIFF(?, CURDATE()) AS days_diff', [requestedDate]);
        if (days_diff < 3) {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 3);
            return res.status(422).json({
                success: false,
                error: `Permohonan minimal harus diajukan 3 hari sebelum jadwal pelaksanaan (minimal tanggal ${minDate.toISOString().split('T')[0]}).`
            });
        }

        // Duplication Validation (ISO Week)
        const [activeRequests] = await db.query(`
            SELECT id, ticket_code, status 
            FROM room_requests 
            WHERE group_id = ? 
              AND YEARWEEK(requested_date, 1) = YEARWEEK(?, 1)
              AND status != 'REJECTED'
            LIMIT 1;
        `, [groupId, requestedDate]);

        if (activeRequests.length > 0) {
            return res.status(409).json({
                success: false,
                error: `Kelompok ini sudah memiliki pengajuan aktif pada pekan tersebut (Tiket: ${activeRequests[0].ticket_code}).`
            });
        }

        // Generate Ticket Code
        const d = new Date(requestedDate);
        const code = `KTB-${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const [result] = await db.query(`
            INSERT INTO room_requests 
            (ticket_code, group_id, requested_date, start_time, end_time, status, submitted_by_nrp)
            VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
        `, [code, groupId, requestedDate, startTime, endTime, submittedByNrp]);

        // Fetch mentor name for email
        const [[mentor]] = await db.query('SELECT nama FROM mentor WHERE id = ?', [groupId]);
        const mentorName = mentor ? mentor.nama : 'Unknown';

        // Send email notification to logistics team members
        db.query("SELECT nrp FROM data_tim WHERE tim = 'logistik' OR (role = 'BPH' AND bidang = 'office')").then(([admins]) => {
            if (admins && admins.length > 0) {
                const notifSubject = `Pengajuan Ruangan Baru: ${code} - KTB ${groupId}`;
                const notifHtml = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #FF5722;">Pengajuan Ruangan Baru Masuk</h2>
                        <p>Halo Tim Logistik,</p>
                        <p>Ada pengajuan ruangan KTB baru yang membutuhkan proses persetujuan segera.</p>
                        <ul>
                            <li><strong>Tiket:</strong> ${code}</li>
                            <li><strong>Kelompok (ID):</strong> ${groupId}</li>
                            <li><strong>Ketua/Mentor:</strong> ${mentorName}</li>
                            <li><strong>Tanggal:</strong> ${new Date(requestedDate).toLocaleDateString('id-ID')}</li>
                            <li><strong>Waktu:</strong> ${startTime} - ${endTime}</li>
                        </ul>
                        <p>Silakan segera login ke dashboard Logistik untuk menyetujui atau mengalokasikan ruangan.</p>
                    </div>
                `;

                // Send to each logistics admin
                for (const admin of admins) {
                    const logistikEmail = `${admin.nrp}@john.petra.ac.id`;
                    emailService.sendEmail(logistikEmail, notifSubject, notifHtml)
                        .catch(err => console.error(`Failed to send notification to ${logistikEmail}:`, err));
                }
            }
        }).catch(err => console.error('Failed to query admins for notification:', err));

        res.status(201).json({
            success: true,
            message: "Permohonan ruangan berhasil diajukan.",
            data: {
                ticketCode: code,
                status: "PENDING",
                requestedDate,
                timeSlot: `${startTime} - ${endTime}`
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const nrp = req.user.nrp;
        const role = req.user.role;
        const userId = req.user.id;

        let query = '';
        let queryParams = [];

        if (role === 'MENTOR') {
            // Mentor can see requests associated with their group_id (which is their mentor id)
            // or requests they submitted themselves
            query = 'SELECT * FROM room_requests WHERE group_id = ? OR submitted_by_nrp = ? ORDER BY created_at DESC';
            queryParams = [userId, nrp];
        } else if (role === 'KETUA_KELOMPOK') {
            // Ketua Kelompok sees requests they submitted
            query = 'SELECT * FROM room_requests WHERE submitted_by_nrp = ? ORDER BY created_at DESC';
            queryParams = [nrp];
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role' });
        }

        const [rows] = await db.query(query, queryParams);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

