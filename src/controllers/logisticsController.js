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
                   r.assigned_by_name AS assignedByName,
                   r.processed_by_nrp AS processedByNrp,
                   m.nama AS mentorName,
                   m.line AS mentorContact
            FROM mentor m
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
            processedByNrp: r.processedByNrp || null,
            mentorName: r.mentorName,
            mentorContact: r.mentorContact
        }));

        res.json({
            matrix
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error ' + err });
    }
};

exports.assignRoom = async (req, res) => {
    const { id } = req.params;
    const { assignedRoom, logisticsNotes } = req.body;
    const assignedByName = req.user ? req.user.name : 'Logistik'; // from auth middleware
    const userNrp = req.user ? req.user.nrp : null;
    const teamRole = req.user ? req.user.teamRole : null;

    try {
        // Check if processed by another admin
        const [[requestData]] = await db.query(`SELECT status, processed_by_nrp FROM room_requests WHERE id = ?`, [id]);
        if (requestData && requestData.status === 'PROSES' && requestData.processed_by_nrp && requestData.processed_by_nrp !== userNrp) {
            return res.status(403).json({ success: false, error: 'Permohonan ini sedang diproses oleh admin lain.' });
        }

        // Fetch the request to check for conflicts
        const [[request]] = await db.query(`
            SELECT r.*, m.nama as group_name, m.email as mentor_email, m.line as mentor_contact,
                   p.nrp as pic_nrp
            FROM room_requests r 
            JOIN mentor m ON r.group_id = m.id 
            LEFT JOIN ketua_kelompok k ON r.submitted_by_nrp = k.nrp
            LEFT JOIN pic_ketua_kelompok p ON k.pic_id = p.id
            WHERE r.id = ?
        `, [id]);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Smart Conflict Detector
        if (assignedRoom && assignedRoom.trim() !== '') {
            const [conflicts] = await db.query(`
                SELECT group_id, start_time, end_time 
                FROM room_requests 
                WHERE assigned_room = ? 
                  AND requested_date = ? 
                  AND status = 'ASSIGNED' 
                  AND id != ?
                  AND start_time < ? 
                  AND end_time > ?
            `, [assignedRoom.trim(), request.requested_date, id, request.end_time, request.start_time]);

            if (conflicts.length > 0) {
                const c = conflicts[0];
                return res.status(409).json({ 
                    success: false, 
                    error: `Ruangan ${assignedRoom} bentrok dengan kelompok KTB ${c.group_id} pada jam ${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}.`
                });
            }
        }

        const [result] = await db.query(`
            UPDATE room_requests 
            SET assigned_room = ?, logistics_notes = ?, assigned_by_name = ?, status = 'ASSIGNED'
            WHERE id = ?
        `, [assignedRoom, logisticsNotes, assignedByName, id]);

        const lineId = request.mentor_contact;
        const lineUrl = `https://line.me/ti/p/~${lineId}`;

        const logisticEmail = req.user && req.user.nrp ? `${req.user.nrp}@john.petra.ac.id` : null;

        // Compute PIC Email if PIC NRP exists
        const picEmail = request.pic_nrp ? `${request.pic_nrp}@john.petra.ac.id` : null;

        // Send Email if applicable
        if (request.mentor_email || logisticEmail || picEmail) {
            const toEmail = request.mentor_email || logisticEmail || picEmail;
            
            const ccEmails = [];
            if (request.mentor_email && logisticEmail) ccEmails.push(logisticEmail);
            if (picEmail && toEmail !== picEmail) ccEmails.push(picEmail);
            
            const ccEmail = ccEmails.length > 0 ? ccEmails.join(',') : undefined;

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
        res.status(500).json({ success: false, error: 'Database error ' + err });
    }
};

exports.rejectRoom = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userNrp = req.user ? req.user.nrp : null;
    const teamRole = req.user ? req.user.teamRole : null;

    try {
        // Check if processed by another admin
        const [[requestData]] = await db.query(`SELECT status, processed_by_nrp FROM room_requests WHERE id = ?`, [id]);
        if (requestData && requestData.status === 'PROSES' && requestData.processed_by_nrp && requestData.processed_by_nrp !== userNrp) {
            return res.status(403).json({ success: false, error: 'Permohonan ini sedang diproses oleh admin lain.' });
        }

        const [result] = await db.query(`
            UPDATE room_requests 
            SET status = 'REJECTED', logistics_notes = ?
            WHERE id = ?
        `, [reason || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Fetch the updated request to send email
        const [[request]] = await db.query(`
            SELECT r.*, m.nama as group_name, m.email as mentor_email, m.line as mentor_contact 
            FROM room_requests r 
            JOIN mentor m ON r.group_id = m.id 
            WHERE r.id = ?
        `, [id]);

        if (request && request.mentor_email) {
            emailService.sendRejectionEmail({
                to: request.mentor_email,
                groupName: request.group_name,
                date: request.requested_date,
                startTime: request.start_time,
                endTime: request.end_time,
                reason: reason || 'Tidak ada alasan khusus.'
            });
        }

        res.json({
            success: true,
            message: "Permohonan ruangan berhasil ditolak."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error ' + err });
    }
};

exports.processRoom = async (req, res) => {
    const { id } = req.params;
    const assignedByName = req.user ? req.user.name : 'Logistik'; // from auth middleware
    const processedByNrp = req.user ? req.user.nrp : null;

    try {
        const [result] = await db.query(`
            UPDATE room_requests 
            SET assigned_by_name = ?, processed_by_nrp = ?, status = 'PROSES'
            WHERE id = ?
        `, [assignedByName, processedByNrp, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Fetch the updated request to send email
        const [[request]] = await db.query(`
            SELECT r.*, m.nama as group_name, m.email as mentor_email, m.line as mentor_contact 
            FROM room_requests r 
            JOIN mentor m ON r.group_id = m.id 
            WHERE r.id = ?
        `, [id]);

        if (request && request.mentor_email) {
            emailService.sendProcessEmail({
                to: request.mentor_email,
                groupName: request.group_name,
                date: request.requested_date,
                startTime: request.start_time,
                endTime: request.end_time,
                assignedByName
            });
        }

        res.json({
            success: true,
            message: "Permohonan ruangan sedang diproses.",
            data: {
                requestId: parseInt(id),
                status: "PROSES",
                assignedByName
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database error ' + err });
    }
};
