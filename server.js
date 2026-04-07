require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const socketio = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const appointmentRoutes = require('./routes/apointement');
const ressourceRoutes = require('./routes/ressource');
const partnerRoutes = require('./routes/partners');
const testimonialRoutes = require('./routes/testimonials');
const adminRoutes = require('./routes/admin');
const expertRoutes = require('./routes/experts');
const resourceRoutes = require('./routes/resources');
const newsRoutes = require('./routes/news');
const eventRoutes = require('./routes/events');
const oportain = require('./routes/OportainRoute')
const demandeRoutes = require('./routes/demande')
const mentorshipRoutes = require('./routes/mentorship')
const sessionRoutes = require('./routes/sessions')
const aiRoutes = require('./routes/ai');
const faqRoutes = require('./routes/faq');
const questionRoutes = require('./routes/questions');
const mongoose = require("mongoose");
const app = express();
app.disable('x-powered-by'); // Sécurité : ne pas révéler qu'on utilise Express
app.enable('trust proxy');
const path = require('path');
const fs = require('fs');
const server = http.createServer(app);

// Créer les dossiers uploads s'ils n'existent pas
const uploadDirs = ['uploads', 'uploads/temp', 'uploads/news', 'uploads/events', 'uploads/partners', 'uploads/resources'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Dossier créé: ${dir}`);
  }
});
const io = socketio(server);

// connect DB
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("ERREUR CRITIQUE: MONGO_URI n'est pas définie dans les variables d'environnement ! ❌");
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log("MongoDB connecté avec succès ✅");
    console.log("Base de données:", mongoose.connection.name);
  })
  .catch(err => {
    console.error("ERREUR DE CONNEXION MONGODB ❌");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
  });

// Route racine (bypass CORS)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="tiktok-site-verification" content="ICzQHfFIb70doD84bZZQgDl4K2AIv8lk" />
      <title>Mentora GN Backend</title>
    </head>
    <body>
      <h1>Bienvenue sur le Backend de Mentora GN</h1>
      <p>Le serveur est opérationnel.</p>
    </body>
    </html>
  `);
});

// Route de vérification TikTok (bypass CORS)
app.get('/tiktokk6ct27zyPP0BJGTfqzyXX4AKDF2rsRFU.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('tiktok-developers-site-verification=ICzQHfFIb70doD84bZZQgDl4K2AIv8lk');
});

// middlewares
app.use(morgan('dev'));
/* app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
})); */
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://diallo01aissatou.github.io',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    // Autoriser les requêtes sans origine (comme les apps mobiles ou curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La politique CORS pour ce site ne permet pas l\'accès depuis l\'origine spécifiée.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// --- SÉCURITÉ : RATE LIMITING (Protection contre force brute) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // Limite beaucoup plus large pour le développement
  message: { message: "Trop de requêtes, veuillez réessayer dans 15 minutes." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Plus permissif pour les tests
  message: { message: "Trop de tentatives de connexion, réessayez plus tard." }
});

/* // Appliquer les limites
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/register', authLimiter); */

app.use(express.json({ limit: '50mb' })); // Augmenté pour les photos Base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* // --- SÉCURITÉ : DATA SANITIZATION (après parsing du body) ---
app.use(mongoSanitize()); // Protection NoSQL injection avec req.body rempli
app.use(hpp());           // Protection Parameter Pollution */
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mentora_secret_session',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/partners', express.static(path.join(__dirname, 'uploads', 'partners')));
app.use('/uploads/temp', express.static(path.join(__dirname, 'uploads', 'temp')));
app.use('/uploads/news', express.static(path.join(__dirname, 'uploads', 'news')));
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads', 'events')));
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads', 'resources')));

// Routes statiques (déplacées en haut)

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne', timestamp: new Date() });
});

// Route de santé
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Déconnecté',
    1: 'Connecté',
    2: 'Connexion en cours',
    3: 'Déconnexion en cours'
  };

  res.json({
    status: 'UP',
    database: statusMap[dbStatus] || 'Inconnu',
    databaseCode: dbStatus,
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    verifications: {
      hasMongoUri: !!(process.env.MONGO_URI || process.env.MONGODB_URI),
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ressources', ressourceRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);

app.use('/api/oportain', oportain);
app.use('/api/demande', demandeRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/questions', questionRoutes);

// socket.io pour chat en temps réel et mentorat
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // Rejoindre une room de conversation
  socket.on('joinRoom', ({ room, userId }) => {
    socket.join(room);
    socket.userId = userId;
    console.log(`User ${userId} joined room ${room}`);
  });

  // Rejoindre une room de mentorat
  socket.on('joinMentorship', ({ mentorshipId, userId }) => {
    const room = `mentorship_${mentorshipId}`;
    socket.join(room);
    socket.userId = userId;
    socket.mentorshipId = mentorshipId;
    console.log(`User ${userId} joined mentorship room ${mentorshipId}`);
  });

  // Envoyer un message
  socket.on('sendMessage', async (payload) => {
    try {
      const { room, message, from, to, mentorshipId } = payload;

      // Sauvegarder le message en base de données
      const Message = require('./models/Message');
      const messageData = {
        sender: from,
        recipient: to,
        content: message.content,
        timestamp: new Date(),
        mentorshipId: mentorshipId || undefined
      };

      const savedMessage = await Message.create(messageData);
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'name photo')
        .populate('recipient', 'name photo');

      // Émettre le message à tous les clients dans la room
      io.to(room).emit('receiveMessage', {
        ...payload,
        message: populatedMessage,
        id: savedMessage._id
      });

      // Notifier l'utilisateur spécifique s'il n'est pas dans la room
      socket.to(to).emit('newMessage', {
        from: from,
        message: populatedMessage
      });

    } catch (error) {
      console.error('Erreur envoi message socket:', error);
      socket.emit('messageError', { error: 'Erreur lors de l\'envoi du message' });
    }
  });

  // Mise à jour du statut de lecture
  socket.on('markAsRead', async ({ messageIds, userId }) => {
    try {
      const Message = require('./models/Message');
      await Message.updateMany(
        { _id: { $in: messageIds }, recipient: userId },
        { read: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  });

  // Notification de demande de mentorat
  socket.on('mentorshipRequest', ({ mentoreId, requestData }) => {
    socket.to(`user_${mentoreId}`).emit('newMentorshipRequest', requestData);
  });

  // Notification de réponse à une demande
  socket.on('mentorshipResponse', ({ mentoreeId, responseData }) => {
    socket.to(`user_${mentoreeId}`).emit('mentorshipResponse', responseData);
  });

  // simple WebRTC signaling pass-through
  socket.on('signal', (data) => {
    // data: { toSocketId, signal }
    io.to(data.toSocketId).emit('signal', { from: socket.id, signal: data.signal });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// Gestionnaire d'erreurs global (doit être après les routes)
app.use((err, req, res, next) => {
  console.error('ERREUR GLOBALE:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err : {},
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Le serveur est lancer avec succès ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});
