const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middlewares/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

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
router.get('/me', protect, authController.getMe);


router.post('/logout', authController.logout);
router.post('/create-admin', authController.createAdmin);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// ==========================================
// ROUTES SOCIAL LOGIN
// ==========================================

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const handleSocialCallback = (req, res) => {
  const token = signToken(req.user);
  const isProd = process.env.NODE_ENV === "production";
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirection vers le frontend
  const frontendUrl = isProd 
    ? "https://diallo01aissatou.github.io/Mentorat-GN-Aissatou" 
    : "http://localhost:5173";
    
  res.redirect(frontendUrl);
};

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), handleSocialCallback);

// Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), handleSocialCallback);

// LinkedIn
router.get('/linkedin', passport.authenticate('linkedin', { state: 'SOME_STATE' }));
router.get('/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), handleSocialCallback);

module.exports = router;
