const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const appointmentController = require('../controllers/appointementController');
const { createAppointmentValidator, updateStatusValidator } = require('../validators/apointementValidator');


router.post('/', protect, createAppointmentValidator, appointmentController.requestAppointment);
router.get('/', protect, appointmentController.getAppointments);
router.get('/my-requests', protect, appointmentController.getMyRequests);
router.get('/my-stats', protect, appointmentController.getMyStats);
router.get('/received-requests', protect, appointmentController.getReceivedRequests);
router.get('/mentor-stats', protect, appointmentController.getMentorStats);
router.get('/mentor-sessions', protect, appointmentController.getMentorSessions);
router.post('/create-session', protect, appointmentController.createSession);
router.put('/respond/:id', protect, appointmentController.respondToRequest);
router.get('/my-sessions', protect, appointmentController.getMenteeSessions);
router.put('/:id', protect, updateStatusValidator, appointmentController.updateStatus);

module.exports = router;
