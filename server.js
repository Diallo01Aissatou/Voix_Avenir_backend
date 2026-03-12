require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const socketio = require('socket.io');
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
const data = require('./config/db')
const app = express();
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
data();

// middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/partners', express.static(path.join(__dirname, 'uploads', 'partners')));
app.use('/uploads/temp', express.static(path.join(__dirname, 'uploads', 'temp')));
app.use('/uploads/news', express.static(path.join(__dirname, 'uploads', 'news')));
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads', 'events')));
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads', 'resources')));

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne', timestamp: new Date() });
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

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Le serveur est lancer avec succès ${PORT}`);
});
