const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Disk storage pour enregistrer les photos sur /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `user-${unique}${ext}`);
  },
});

const upload = multer({ storage });




const authController = require('../controllers/authController');

// const { adminCreateUserValidator} = require('../validators/userValidator');
router.post('/register', upload.single('photo'), authController.register);
router.post('/login', authController.login);


router.post('/logout', authController.logout);
router.post('/create-admin', authController.createAdmin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);



module.exports = router;
