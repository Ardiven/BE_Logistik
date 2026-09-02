const db = require('../config/database');
const jwt = require('jsonwebtoken');
const net = require('net');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const authenticatePOP3 = (username, password) => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let step = 0;
        
        client.setTimeout(15000); // 15 seconds timeout
        
        client.connect(110, 'john.petra.ac.id', () => {
            // Connected
        });

        client.on('data', (data) => {
            const response = data.toString();
            if (response.startsWith('+')) {
                if (step === 0) {
                    // Send username
                    client.write(`USER ${username}\r\n`);
                    step = 1;
                } else if (step === 1) {
                    // Send password
                    client.write(`PASS ${password}\r\n`);
                    step = 2;
                } else if (step === 2) {
                    // Authenticated successfully
                    client.end();
                    resolve(true);
                }
            } else {
                client.end();
                resolve(false);
            }
        });

        client.on('error', (err) => {
            client.end();
            resolve(false);
        });

        client.on('timeout', () => {
            client.end();
            resolve(false);
        });
    });
};

const getPetraName = async (username) => {
    try {
        const response = await axios.get(`http://john.petra.ac.id/~justin/finger.php?s=${username}`);
        if (response.data && response.data.hasil && response.data.hasil.length > 0) {
            return response.data.hasil[0].nama;
        }
        return null;
    } catch (err) {
        return null;
    }
};

exports.login = async (req, res) => {
    let { username, password, role } = req.body; // role: 'KETUA_KELOMPOK', 'MENTOR', or 'LOGISTIK'

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'Harap isi NRP/Username, Password, dan Role' });
    }
    
    // As per PHP code: substr($username, 0, 9)
    username = username.substring(0, 9);

    try {
        let user = null;

        // Check database first if user has the correct role
        if (role === 'LOGISTIK') {
            const [rows] = await db.query('SELECT * FROM admin WHERE nrp = ? AND bidang = ?', [username, 'logistik']);
            if (rows.length > 0) {
                user = rows[0];
            }
        } else if (role === 'KETUA_KELOMPOK') {
            const [rows] = await db.query('SELECT * FROM ketua_kelompok WHERE nrp = ?', [username]);
            if (rows.length > 0) {
                user = rows[0];
            }
        } else if (role === 'MENTOR') {
            const [rows] = await db.query('SELECT * FROM mentor WHERE nrp = ?', [username]);
            if (rows.length > 0) {
                user = rows[0];
            }
        } else {
            return res.status(400).json({ success: false, message: 'Role tidak valid' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: `Akun tidak ditemukan atau Anda tidak terdaftar sebagai ${role}` });
        }

        // Attempt POP3 Auth
        let isAuthenticated = false;
        try {
            isAuthenticated = await authenticatePOP3(username, password);
        } catch (e) {
            console.log('POP3 Auth error:', e.message);
        }
        
        // Fallback for local development or if POP3 fails
        if (!isAuthenticated) {
            // Check if password matches the database password OR is the universal bypass password 'rahasia'
            if (user.password !== password && password !== 'rahasia') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Koneksi ke server email Petra gagal (ECONNREFUSED) dan password lokal tidak cocok. Gunakan password "rahasia" untuk testing.' 
                });
            }
        }
        
        // Try fetching name from Finger API if it's not set
        let name = user.nama || user.nrp;
        if (!user.nama || user.nama === '') {
            const petraName = await getPetraName(username);
            if (petraName) name = petraName;
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                nrp: user.nrp, 
                role,
                name: name
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nrp: user.nrp,
                name: name,
                role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
