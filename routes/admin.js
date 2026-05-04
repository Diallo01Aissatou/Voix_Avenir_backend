const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// Route pour les statistiques admin
router.get('/stats', protect, authorize('admin'), adminController.getAdminStats);

// Route pour nettoyer les ressources cassées (ancien système)
router.post('/cleanup-resources', protect, authorize('admin'), adminController.cleanupBrokenResources);

module.exports = router;