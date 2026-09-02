const db = require('../config/database');
const emailService = require('../services/emailService');

exports.createRequest = async (req, res) => {
    const { groupId, leaderName, leaderContact, leaderEmail, preferredChannel, requestedDate, startTime, endTime } = req.body;

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
            (ticket_code, group_id, leader_name, leader_contact, leader_email, preferred_channel, requested_date, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [code, groupId, leaderName, leaderContact, leaderEmail, preferredChannel || 'WHATSAPP', requestedDate, startTime, endTime]);

        // Send email notification to logistics team members
        db.query('SELECT nrp FROM admin WHERE bidang = ?', ['logistik']).then(([admins]) => {
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
                            <li><strong>Ketua:</strong> ${leaderName}</li>
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
