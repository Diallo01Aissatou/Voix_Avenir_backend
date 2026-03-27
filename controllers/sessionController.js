const Session = require('../models/Session');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Créer une notification
const createNotification = async (recipientId, senderId, type, title, message, sessionId = null, requestId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      sessionId,
      requestId
    });
    await notification.save();
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
};

// Créer une séance
exports.createSession = async (req, res) => {
  try {
    const { mentorshipRequestId, topic, description, scheduledDate, scheduledTime, duration, mode } = req.body;

    const mentorshipRequest = await MentorshipRequest.findById(mentorshipRequestId);
    if (!mentorshipRequest || mentorshipRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Mentorat non trouvé ou non accepté' });
    }

    const session = new Session({
      mentore: mentorshipRequest.mentore,
      mentoree: mentorshipRequest.mentoree,
      mentorshipRequest: mentorshipRequestId,
      topic,
      description,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration: duration || 60,
      mode: mode || 'online'
    });

    await session.save();

    // Créer notification pour la mentorée
    await createNotification(
      mentorshipRequest.mentoree,
      req.user._id,
      'session_created',
      'Nouvelle séance planifiée',
      `Une séance "${topic}" a été planifiée pour le ${new Date(scheduledDate).toLocaleDateString('fr-FR')}`,
      session._id
    );

    const populatedSession = await Session.findById(session._id)
      .populate('mentore', 'name photo profession')
      .populate('mentoree', 'name photo profession');

    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les séances
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const query = {};
    if (userRole === 'mentore') {
      query.mentore = userId;
    } else {
      query.mentoree = userId;
    }

    const sessions = await Session.find(query)
      .populate('mentore', 'name photo profession')
      .populate('mentoree', 'name photo profession')
      .sort({ scheduledDate: 1 });

    // Ajouter URLs photos
    const sessionsWithPhotoUrl = sessions.map(session => {
      const sessionObj = session.toObject();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      if (sessionObj.mentore?.photo && !sessionObj.mentore.photo.startsWith('http')) {
        sessionObj.mentore.photo = `${baseUrl}/uploads/${sessionObj.mentore.photo.split('/').pop()}`;
      }
      if (sessionObj.mentoree?.photo && !sessionObj.mentoree.photo.startsWith('http')) {
        sessionObj.mentoree.photo = `${baseUrl}/uploads/${sessionObj.mentoree.photo.split('/').pop()}`;
      }
      return sessionObj;
    });

    res.json(sessionsWithPhotoUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Générer un lien Google Meet
const generateGoogleMeetLink = () => {
  // Générer un ID unique pour la réunion
  const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `https://meet.google.com/${meetingId}`;
};

// Confirmer une séance
exports.confirmSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(sessionId).populate(['mentore', 'mentoree']);
    if (!session) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (session.mentoree._id.toString() !== userId.toString() && session.mentore._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Générer automatiquement un lien Google Meet si pas déjà présent
    if (!session.meetingLink && (session.mode === 'online' || session.mode === 'video')) {
      session.meetingLink = generateGoogleMeetLink();
    }

    session.status = 'confirmed';
    session.confirmedAt = new Date();
    await session.save();

    // Notification à l'autre partie avec le lien
    const recipientId = session.mentoree._id.toString() === userId.toString() ? session.mentore._id : session.mentoree._id;
    const meetingInfo = session.meetingLink ? ` - Lien: ${session.meetingLink}` : '';

    await createNotification(
      recipientId,
      userId,
      'session_confirmed',
      'Séance confirmée avec lien de réunion',
      `La séance "${session.topic}" a été confirmée${meetingInfo}`,
      session._id
    );

    res.json({
      message: 'Séance confirmée et lien Google Meet généré',
      session,
      meetingLink: session.meetingLink
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Annuler une séance
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(sessionId).populate(['mentore', 'mentoree']);
    if (!session) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (session.mentoree._id.toString() !== userId.toString() && session.mentore._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.cancelledBy = userId;
    await session.save();

    // Notification à l'autre partie
    const recipientId = session.mentoree._id.toString() === userId.toString() ? session.mentore._id : session.mentoree._id;
    await createNotification(
      recipientId,
      userId,
      'session_cancelled',
      'Séance annulée',
      `La séance "${session.topic}" a été annulée`,
      session._id
    );

    res.json({ message: 'Séance annulée', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une séance
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { topic, description, scheduledDate, scheduledTime, duration, mode, meetingLink } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId).populate(['mentore', 'mentoree']);
    if (!session) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (session.mentore._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Seule la mentore peut modifier' });
    }

    if (topic) session.topic = topic;
    if (description) session.description = description;
    if (scheduledDate) session.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) session.scheduledTime = scheduledTime;
    if (duration) session.duration = duration;
    if (mode) session.mode = mode;
    if (meetingLink) session.meetingLink = meetingLink;

    await session.save();

    // Notification à la mentorée
    await createNotification(
      session.mentoree._id,
      userId,
      'session_updated',
      'Séance modifiée',
      `Les détails de la séance "${session.topic}" ont été modifiés`,
      session._id
    );

    res.json({ message: 'Séance mise à jour', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Terminer une séance
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(sessionId).populate(['mentore', 'mentoree']);
    if (!session) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (session.mentore._id.toString() !== userId.toString() && session.mentoree._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    res.json({ message: 'Séance terminée', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name photo')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer notification comme lue
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une séance
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(sessionId).populate(['mentore', 'mentoree']);
    if (!session) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    // Vérifier que l'utilisateur est autorisé (mentore ou mentorée)
    if (session.mentoree._id.toString() !== userId.toString() && session.mentore._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que la séance peut être supprimée (terminée ou annulée)
    if (session.status !== 'completed' && session.status !== 'cancelled' && session.status !== 'canceled') {
      return res.status(400).json({ message: 'Seules les séances terminées ou annulées peuvent être supprimées' });
    }

    await Session.findByIdAndDelete(sessionId);

    res.json({ message: 'Séance supprimée de l\'historique' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};