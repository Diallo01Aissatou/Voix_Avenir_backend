const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configuration du transporteur d'e-mails (Lazy Singleton)
// Configuration du transporteur d'e-mails (Lazy Singleton)
let transporter;
const getTransporter = () => {
    if (!transporter) {
        // Détection de l'environnement : Priorité Mailtrap sur Render à cause des blocages SMTP Gmail
        if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
            console.log('Utilisation du transporteur Mailtrap (Port 2525) pour Render');
            transporter = nodemailer.createTransport({
                host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
                port: parseInt(process.env.MAILTRAP_PORT) || 2525,
                auth: {
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS
                }
            });
        } else {
            // Fallback Gmail (utile en local si pas de Mailtrap configuré)
            const cleanPass = (process.env.EMAIL_PASSS || '').replace(/\s+/g, '');
            console.log('Utilisation du transporteur Gmail (Port 587)');
            transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USERS,
                    pass: cleanPass
                },
                tls: { rejectUnauthorized: false }
            });
        }
    }
    return transporter;
};

// Blacklist en mémoire pour les tokens invalidés
const tokenBlacklist = new Set();

// Générer JWT
const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Options de cookie selon l'environnement
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
};

// Stocker le token dans le cookie
const sendTokenInCookie = (res, user, message) => {
  const token = signToken(user);
  res.cookie("token", token, getCookieOptions());
  res.status(200).json({
    message,
    user: { 
      id: user._id, 
      name: user.name, 
      role: user.role, 
      verified: user.verified, 
      email: user.email, 
      isMasterAdmin: user.isMasterAdmin,
      photo: user.photo 
    },
    token // Ajout du token dans la réponse JSON
  });
};

// ==================================
// REGISTER
// ==================================

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      age,
      city,
      level,
      interests,
      profession,
      expertise,
      bio
    } = req.body;

    // Vérification des champs obligatoires
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier si l'utilisateur existe déjà
    let existingUser;
    try {
      existingUser = await User.findOne({ email });
    } catch (dbError) {
      console.error('Erreur de connexion à la base de données:', dbError.message);
      return res.status(500).json({ message: "Erreur de connexion à la base de données. Vérifiez que MongoDB est démarré." });
    }

    if (existingUser) {
      return res.status(400).json({ message: "Adresse e-mail déjà utilisée" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transformer interests et expertise en tableaux si ce sont des chaînes
    const parseToArray = (value) => {
      if (!value) return []; // si undefined/null → tableau vide
      if (Array.isArray(value)) return value; // si déjà tableau → on garde
      if (typeof value === "string") {
        return value.split(",").map((v) => v.trim()); // si string → on découpe
      }
      return []; // cas par défaut
    };

    const interestsArray = parseToArray(interests);
    const expertiseArray = parseToArray(expertise);


    // Préparer les données de l'utilisateur
    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role,
      age,
      city,
      level,
      interests: interestsArray,
      profession,
      expertise: expertiseArray,
      bio: bio || '',
      isApproved: role === 'mentore' ? false : true // Les mentores doivent être validées
    };

    // Enregistrer la photo si fournie (diskStorage)
    if (req.file) {
      userPayload.photo = `/uploads/${req.file.filename}`;
    }

    // Créer l'utilisateur dans la base
    let newUser;
    try {
      newUser = await User.create(userPayload);
    } catch (createError) {
      console.error('Erreur lors de la création de l\'utilisateur:', createError.message);
      if (createError.code === 11000) {
        return res.status(400).json({ message: "Adresse e-mail déjà utilisée" });
      }
      return res.status(500).json({ message: "Erreur lors de la création du compte. Vérifiez que MongoDB est démarré." });
    }

    // Envoyer le token + message de succès
    sendTokenInCookie(res, newUser, "Inscription réussie");


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


// ==================================
// LOGIN
// ==================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email ou mot de passe manquant' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Aucun compte n'est associé à cette adresse e-mail. Veuillez vérifier ou vous inscrire." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Le mot de passe que vous avez saisi est incorrect." });

    sendTokenInCookie(res, user, "Connexion réussie");

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ==================================
// GET ME (Vérifier session)
// ==================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    res.status(200).json({
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        verified: user.verified, 
        email: user.email, 
        isMasterAdmin: user.isMasterAdmin,
        photo: user.photo 
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ==================================
// LOGOUT
// ==================================
exports.logout = (req, res) => {
  try {
    const options = getCookieOptions();
    options.maxAge = 0;
    res.cookie("token", "", options);
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// Mot de passe oublié
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Adresse email requise" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Aucun compte associé à cette adresse email" });
    }

    // Générer un token simple
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // URL de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173/Voix_D-avenir";
    const resetUrl = `${frontendUrl}?page=reset-password&token=${resetToken}`;

    // Configuration Gmail SMTP
    console.log('Tentative d\'envoi email à:', user.email);

    // Envoi de l'e-mail en arrière-plan sans bloquer la réponse client
    const mailOptions = {
      from: `"Mentorat GN" <${process.env.EMAIL_USERS}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe - Mentorat GN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #7c3aed; text-align: center;">Réinitialisation de mot de passe</h2>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Mentorat GN.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p><strong>Ce lien expirera dans 10 minutes.</strong></p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">Équipe Mentorat GN - Propulsé par Voix d'Avenir</p>
        </div>
      `
    };

    getTransporter().sendMail(mailOptions).then(info => {
      console.log('✅ Email envoyé avec succès à', user.email, ':', info.messageId);
    }).catch(err => {
      console.error('❌ ERREUR D\'ENVOI EMAIL (Background):', err.message);
      console.error('Détails:', err);
    });

    // Réponse immédiate au client
    res.status(200).json({
      message: "Un email de réinitialisation a été envoyé à votre adresse email."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Nouveau mot de passe requis" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Hash du token pour comparaison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Trouver l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Supprimer le token de réinitialisation
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Créer un admin (route spéciale)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Adresse e-mail déjà utilisée" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      city: 'Conakry',
      verified: true
    });

    sendTokenInCookie(res, admin, "Admin créé avec succès");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};



// Route de diagnostic SMTP pour Render
exports.testSmtp = async (req, res) => {
    const results = [];
    const configs = [
        { host: 'smtp.gmail.com', port: 465, secure: true, label: 'Gmail 465 (SSL)' },
        { host: 'smtp.gmail.com', port: 587, secure: false, label: 'Gmail 587 (STARTTLS)' },
        { host: 'sandbox.smtp.mailtrap.io', port: 2525, secure: false, label: 'Mailtrap 2525' }
    ];

    const cleanPass = (process.env.EMAIL_PASSS || '').replace(/\s+/g, '');

    for (const config of configs) {
        console.log(`Test de connexion: ${config.label}...`);
        
        // Déterminer les identifiants
        const user = config.label.includes('Mailtrap') ? process.env.MAILTRAP_USER : process.env.EMAIL_USERS;
        const pass = config.label.includes('Mailtrap') ? process.env.MAILTRAP_PASS : cleanPass;

        const testTransporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user, pass },
            connectionTimeout: 5000,
            greetingTimeout: 5000
        });

        try {
            await testTransporter.verify();
            results.push({ label: config.label, status: 'SUCCÈS ✅' });
        } catch (err) {
            results.push({ label: config.label, status: 'ÉCHEC ❌', error: err.message });
        }
    }

    res.status(200).json({
        message: "Diagnostic SMTP terminé",
        results: results,
        diagnostics: {
            node_env: process.env.NODE_ENV,
            email_user: process.env.EMAIL_USERS,
            password_configured: !!process.env.EMAIL_PASSS
        }
    });
};

// Export blacklist
exports.tokenBlacklist = tokenBlacklist;
