const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { updateMeValidator} = require('../validators/userValidator');

// Routes publiques pour recherche
router.get('/', userController.getMentores);
router.get('/mentores', userController.getMentores);
router.get('/stats', userController.getPublicStats);
router.get('/cities', userController.getCities);
router.get('/expertise', userController.getExpertise);

// Routes protégées
router.get('/profile', protect, userController.getMyProfile);
router.put('/profile', protect, userController.updateMyProfile);
router.post('/profile/photo', protect, upload.single('photo'), userController.uploadProfilePhoto);

// Routes admin
router.get('/admin/all', protect, authorize("admin"), userController.getAllUsers);
router.get('/admin/stats', protect, authorize("admin"), userController.getStats);
router.get('/admin/:id', protect, authorize("admin"), userController.getUserById);
router.put('/admin/approve/:id', protect, authorize('admin'), userController.approveMentor);
router.put('/admin/:id', protect, authorize("admin"), updateMeValidator, userController.updateUser);
router.delete('/admin/:id', protect, authorize('admin'), userController.deleteUser);

router.post('/documents', protect, upload.array('files', 5), userController.uploadDocuments);



module.exports = router;
