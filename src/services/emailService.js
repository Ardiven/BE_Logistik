const nodemailer = require('nodemailer');

let transporter;

async function initTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Use provided SMTP settings
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('Email service initialized with provided SMTP credentials.');
    } else {
        // Create an Ethereal test account for local testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log('===========================================================');
        console.log('WARNING: No SMTP credentials found in .env');
        console.log('Email service initialized with Ethereal Test Account.');
        console.log(`Test Email User: ${testAccount.user}`);
        console.log('Check sent emails at: https://ethereal.email/login');
        console.log('===========================================================');
    }
}

// Initialize on load
initTransporter().catch(console.error);

/**
 * Sends an email notification when a room is assigned.
 * @param {Object} data 
 * @param {string} data.to - Leader email address
 * @param {string} data.groupName - KTB group name
 * @param {string} data.assignedRoom - Assigned room
 * @param {string} data.date - Request date
 * @param {string} data.startTime - Start time
 * @param {string} data.endTime - End time
 * @param {string} data.assignedByName - Name of logistics member
 */
const sendAssignmentEmail = async (data) => {
    try {
        if (!transporter) {
            console.log("Transporter not ready yet, waiting...");
            // short wait for init
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const info = await transporter.sendMail({
            from: '"TPS Logistik" <no-reply@tps.petra.ac.id>',
            to: data.to,
            cc: data.cc,
            subject: 'Pemberitahuan: Ruangan KTB Berhasil Ditetapkan',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #FF5722;">Ruangan KTB Ditetapkan</h2>
                    <p>Halo Ketua ${data.groupName},</p>
                    <p>Permohonan peminjaman ruangan KTB Anda telah <strong>disetujui</strong>.</p>
                    <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Ruangan</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd; color: #4CAF50; font-weight: bold;">${data.assignedRoom}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Tanggal</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(data.date).toLocaleDateString('id-ID')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Waktu</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${data.startTime} - ${data.endTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Ditetapkan Oleh</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${data.assignedByName} (Tim Logistik)</td>
                        </tr>
                    </table>
                    <p>Tolong gunakan ruangan ini dengan sebaik-baiknya dan jaga kebersihan.</p>
                    <p>Salam,<br>Tim Logistik TPS</p>
                </div>
            `,
        });

        console.log('Assignment Email sent: %s', info.messageId);
        if (info.messageId && process.env.SMTP_HOST === undefined) {
             console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

/**
 * Sends an email notification when a room request is rejected.
 * @param {Object} data 
 */
const sendRejectionEmail = async (data) => {
    try {
        if (!transporter) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const info = await transporter.sendMail({
            from: '"TPS Logistik" <no-reply@tps.petra.ac.id>',
            to: data.to,
            subject: 'Pemberitahuan: Peminjaman Ruangan KTB Ditolak',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #F44336;">Permohonan Ruangan Ditolak</h2>
                    <p>Halo Ketua ${data.groupName},</p>
                    <p>Mohon maaf, permohonan peminjaman ruangan KTB Anda untuk tanggal <strong>${new Date(data.date).toLocaleDateString('id-ID')}</strong> jam <strong>${data.startTime} - ${data.endTime}</strong> terpaksa <strong>ditolak</strong>.</p>
                    <p>Alasan penolakan mungkin dikarenakan ruangan penuh atau jadwal tidak memungkinkan. Silakan ajukan permohonan kembali dengan jadwal atau ruangan yang berbeda.</p>
                    <p>Salam,<br>Tim Logistik TPS</p>
                </div>
            `,
        });

        console.log('Rejection Email sent: %s', info.messageId);
        if (info.messageId && process.env.SMTP_HOST === undefined) {
             console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendAssignmentEmail,
    sendRejectionEmail
};
