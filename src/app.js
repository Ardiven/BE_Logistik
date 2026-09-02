const express = require('express');
const cors = require('cors');
require('dotenv').config();

const groupController = require('./controllers/groupController');
const requestController = require('./controllers/requestController');
const logisticsController = require('./controllers/logisticsController');
const authController = require('./controllers/authController');
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

app.get('/api/logistics/matrix', verifyToken, logisticsController.getMatrix);
app.patch('/api/logistics/requests/:id/assign', verifyToken, verifyRole(['LOGISTIK']), logisticsController.assignRoom);
app.patch('/api/logistics/requests/:id/reject', verifyToken, verifyRole(['LOGISTIK']), logisticsController.rejectRoom);
app.patch('/api/logistics/requests/:id/process', verifyToken, verifyRole(['LOGISTIK']), logisticsController.processRoom);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    cronService.startCron();
});
