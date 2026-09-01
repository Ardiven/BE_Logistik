const db = require('../config/database');
const emailService = require('../services/emailService');

exports.getMatrix = async (req, res) => {
    const { date } = req.query;
    try {
        // Find requests for a specific date.
        
        let query = `
            SELECT m.id AS groupId, m.id AS groupNumber, m.nama AS groupName,
                   r.id AS requestId, r.ticket_code AS ticketCode, r.status, 
                   r.requested_date AS requestedDate, r.start_time AS startTime, 
                   r.end_time AS endTime, r.assigned_room AS assignedRoom,
                   r.assigned_by_name AS assignedByName,
                   COALESCE(r.leader_name, m.nama) AS leaderName,
                   COALESCE(r.leader_contact, m.line) AS leaderContact
            FROM tps.mentor m
            JOIN room_requests r ON m.id = r.group_id 
        `;
        let params = [];
        
        query += ` AND r.requested_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 10 DAY) AND r.status != 'REJECTED'`;

        query += ` ORDER BY m.nama ASC`;

        const [rows] = await db.query(query, params);
        
        const matrix = rows.map(r => ({
            groupNumber: r.groupNumber,
            groupName: r.groupName,
            hasRequest: !!r.requestId,
            requestId: r.requestId || null,
            ticketCode: r.ticketCode || null,
            status: r.status || 'UNSUBMITTED',
            requestedDate: r.requestedDate || null,
            startTime: r.startTime || null,
            endTime: r.endTime || null,
            assignedRoom: r.assignedRoom || null,
            assignedByName: r.assignedByName || null,
            leaderName: r.leaderName,
            leaderContact: r.leaderContact
        }));

        res.json({
            matrix
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

exports.assignRoom = async (req, res) => {
    const { id } = req.params;
    const { assignedRoom, logisticsNotes } = req.body;
    const assignedByName = req.user ? req.user.name : 'Logistik'; // from auth middleware

    try {
        const [result] = await db.query(`
            UPDATE room_requests 
            SET assigned_room = ?, logistics_notes = ?, assigned_by_name = ?, status = 'ASSIGNED'
            WHERE id = ?
        `, [assignedRoom, logisticsNotes, assignedByName, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Fetch the updated request to generate the WhatsApp URL
        const [[request]] = await db.query(`
            SELECT r.*, m.nama as group_name 
            FROM room_requests r 
            JOIN tps.mentor m ON r.group_id = m.id 
            WHERE r.id = ?
        `, [id]);

        const lineId = request.leader_contact;
        const lineUrl = `https://line.me/ti/p/~${lineId}`;
        
        const logisticEmail = req.user && req.user.nrp ? `${req.user.nrp}@john.petra.ac.id` : null;

        // Send Email if applicable
        if (request.leader_email || logisticEmail) {
            const toEmail = request.leader_email || logisticEmail;
            const ccEmail = request.leader_email && logisticEmail ? logisticEmail : undefined;
            
            emailService.sendAssignmentEmail({
                to: toEmail,
                cc: ccEmail,
                groupName: request.group_name,
                assignedRoom,
                date: request.requested_date,
                startTime: request.start_time,
                endTime: request.end_time,
                assignedByName
            });
        }

        res.json({
            success: true,
            message: "Ruangan berhasil ditetapkan.",
            data: {
                requestId: parseInt(id),
                ticketCode: request.ticket_code,
                status: "ASSIGNED",
                assignedRoom,
                assignedByName,
                whatsappNotificationUrl: lineUrl
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

exports.rejectRoom = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(`
            UPDATE room_requests 
            SET status = 'REJECTED'
            WHERE id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Fetch the updated request to send email
        const [[request]] = await db.query(`
            SELECT r.*, m.nama as group_name 
            FROM room_requests r 
            JOIN tps.mentor m ON r.group_id = m.id 
            WHERE r.id = ?
        `, [id]);

        if (request && request.leader_email) {
            emailService.sendRejectionEmail({
                to: request.leader_email,
                groupName: request.group_name,
                date: request.requested_date,
                startTime: request.start_time,
                endTime: request.end_time
            });
        }

        res.json({
            success: true,
            message: "Permohonan ruangan berhasil ditolak."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};
