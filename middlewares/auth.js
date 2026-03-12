const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { tokenBlacklist } = require("../controllers/authController"); // importe la blacklist

exports.protect = async (req, res, next) => {
  let token;
  
  // Vérifier le token dans les headers Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Vérifier le token dans les cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Si pas de token
  if (!token) {
    return res.status(401).json({ message: "Vous devez être connecté pour accéder à cette ressource" });
  }

  // Si token est blacklisté
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token invalide, veuillez vous reconnecter" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

    req.user = user; // stocke l'utilisateur pour la route
    next();          // passe à la route suivante
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// Middleware pour autoriser certains rôles
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès interdit" });
  }
  next();
};
