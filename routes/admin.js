const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// Route pour les statistiques admin
router.get('/stats', protect, authorize('admin'), adminController.getAdminStats);

module.exports = router;