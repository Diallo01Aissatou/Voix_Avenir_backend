const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/auth');
const resourceController = require('../controllers/resourceController');

// Configuration multer pour les fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, 'uploads/');
    } else if (file.fieldname === 'resourceFile') {
      cb(null, 'uploads/resources/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === 'resourceFile' ? 'resource-' : 'image-';
    cb(null, prefix + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else if (file.fieldname === 'resourceFile') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-ms-wmv'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Type de fichier non autorisé'), false);
      }
    } else {
      cb(new Error('Champ de fichier non reconnu'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max pour les vidéos
  }
});

// Routes publiques
router.get('/', resourceController.getResources);

// Routes admin
router.post('/', protect, authorize('admin'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'resourceFile', maxCount: 1 }]), resourceController.createResource);
router.delete('/:id', protect, authorize('admin'), resourceController.deleteResource);
router.put('/featured/:id', protect, authorize('admin'), resourceController.toggleFeatured);

// Route publique pour incrémenter les téléchargements
router.put('/download/:id', resourceController.incrementDownload);

// Route publique pour incrémenter les vues
router.put('/view/:id', resourceController.incrementViews);

// Route pour télécharger un fichier (ancien systeme)
router.get('/download-file/:id', resourceController.downloadFile);

// Route pour servir un fichier depuis GridFS (nouveau systeme)
// Le :filename? optionnel à la fin aide certains navigateurs à reconnaître le type de fichier
router.get('/serve-file/:id/:filename?', resourceController.serveFile);

// Route admin pour modifier une ressource
router.put('/:id', protect, authorize('admin'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'resourceFile', maxCount: 1 }]), resourceController.updateResource);

module.exports = router;