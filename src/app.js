const express = require('express');
const cors = require('cors');
require('dotenv').config();

const groupController = require('./controllers/groupController');
const requestController = require('./controllers/requestController');
const logisticsController = require('./controllers/logisticsController');
const authController = require('./controllers/authController');
const settingsController = require('./controllers/settingsController');
const { verifyToken, verifyRole } = require('./middleware/auth');
const cronService = require('./services/cronService');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/auth/login', authController.login);

// Protected routes
app.get('/api/groups', verifyToken, groupController.getGroups);
app.post('/api/requests', verifyToken, verifyRole(['KETUA_KELOMPOK', 'MENTOR']), requestController.createRequest);
app.get('/api/requests/my', verifyToken, verifyRole(['KETUA_KELOMPOK', 'MENTOR']), requestController.getMyRequests);

app.get('/api/logistics/matrix', verifyToken, logisticsController.getMatrix);
app.patch('/api/logistics/requests/:id/assign', verifyToken, verifyRole(['LOGISTIK', 'BPH_OFFICE']), logisticsController.assignRoom);
app.patch('/api/logistics/requests/:id/reject', verifyToken, verifyRole(['LOGISTIK', 'BPH_OFFICE']), logisticsController.rejectRoom);
app.patch('/api/logistics/requests/:id/process', verifyToken, verifyRole(['LOGISTIK', 'BPH_OFFICE']), logisticsController.processRoom);

app.get('/api/settings', verifyToken, verifyRole(['LOGISTIK', 'BPH_OFFICE']), settingsController.getSettings);
app.put('/api/settings', verifyToken, verifyRole(['LOGISTIK', 'BPH_OFFICE']), settingsController.updateSettings);

const adminController = require('./controllers/adminController');
app.get('/api/admin/materials', verifyToken, verifyRole(['BPH', 'BPH_OFFICE']), adminController.getMaterials);
app.get('/api/admin/dashboard', verifyToken, verifyRole(['BPH', 'BPH_OFFICE']), adminController.getDashboardStats);
app.get('/api/admin/presensi/:materiId', verifyToken, verifyRole(['BPH', 'BPH_OFFICE']), adminController.getPresensi);
app.get('/api/admin/assessment/:materiId', verifyToken, verifyRole(['BPH', 'BPH_OFFICE']), adminController.getAssessment);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    cronService.startCron();
});
