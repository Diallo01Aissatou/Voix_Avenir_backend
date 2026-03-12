const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createSession,
  getSessions,
  confirmSession,
  cancelSession,
  updateSession,
  completeSession,
  deleteSession,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/sessionController');

// Routes pour les séances
router.post('/', protect, createSession);
router.get('/', protect, getSessions);
router.put('/:sessionId/confirm', protect, confirmSession);
router.put('/:sessionId/cancel', protect, cancelSession);
router.put('/:sessionId/update', protect, updateSession);
router.put('/:sessionId/complete', protect, completeSession);
router.delete('/:sessionId', protect, deleteSession);

// Routes pour les notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:notificationId/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

module.exports = router;