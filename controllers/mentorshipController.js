const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Message = require('../models/Message');

// Créer une demande de mentorat
exports.createRequest = async (req, res) => {
  try {
    console.log('Création demande - User:', req.user._id, 'Body:', req.body);
    const { mentoreId, message } = req.body;

    if (!mentoreId || !message) {
      return res.status(400).json({
        message: 'MentoreId et message sont requis'
      });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = await MentorshipRequest.findOne({
      mentoree: req.user._id,
      mentore: mentoreId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      console.log('Demande existante trouvée:', existingRequest);
      return res.status(400).json({
        message: 'Une demande existe déjà avec cette mentore'
      });
    }

    const request = new MentorshipRequest({
      mentoree: req.user._id,
      mentore: mentoreId,
      message,
      status: 'pending'
    });

    console.log('Sauvegarde demande:', request);
    const savedRequest = await request.save();
    console.log('Demande sauvegardée:', savedRequest);

    const populatedRequest = await MentorshipRequest.findById(savedRequest._id)
      .populate('mentoree', 'name photo profession city level')
      .populate('mentore', 'name photo profession expertise bio');

    console.log('Demande peuplée:', populatedRequest);
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Erreur création demande:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: error.message });
  }
};

// Obtenir les demandes envoyées par la mentorée
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ mentoree: req.user._id })
      .populate('mentore', 'name photo profession expertise bio city availableDays startTime endTime')
      .sort({ createdAt: -1 });

    // Ajouter l'URL complète pour les photos
    const requestsWithPhotoUrl = requests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.mentore?.photo && !requestObj.mentore.photo.startsWith('http')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        requestObj.mentore.photo = `${baseUrl}/uploads/${requestObj.mentore.photo.split('/').pop()}`;
      }
      return requestObj;
    });

    res.json(requestsWithPhotoUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les demandes reçues par la mentore
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ mentore: req.user._id })
      .populate('mentoree', 'name photo profession level city bio interests age availableDays startTime endTime')
      .sort({ createdAt: -1 });

    const requestsWithPhotoUrl = requests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.mentoree?.photo) {
        // Corriger l'URL de la photo
        const photoPath = requestObj.mentoree.photo;
        if (!photoPath.startsWith('http')) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          requestObj.mentoree.photo = `${baseUrl}${photoPath.startsWith('/') ? photoPath : '/' + photoPath}`;
        }
      }
      return requestObj;
    });

    res.json(requestsWithPhotoUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Répondre à une demande (accepter/refuser)
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const request = await MentorshipRequest.findOneAndUpdate(
      { _id: requestId, mentore: req.user._id, status: 'pending' },
      {
        status,
        responseMessage,
        updatedAt: new Date(),
        startDate: status === 'accepted' ? new Date() : undefined
      },
      { new: true }
    ).populate(['mentoree', 'mentore']);

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée ou déjà traitée' });
    }

    // Si acceptée, créer un message système (optionnel)
    if (status === 'accepted') {
      try {
        const systemMessage = new Message({
          sender: req.user._id,
          recipient: request.mentoree._id,
          content: `Votre demande de mentorat a été acceptée ! Vous pouvez maintenant commencer à échanger des messages.`,
          messageType: 'system',
          mentorshipId: request._id
        });
        await systemMessage.save();
      } catch (msgError) {
        console.log('Erreur création message système:', msgError.message);
        // Continue sans bloquer la réponse
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les mentorats actifs
exports.getActiveMentorships = async (req, res) => {
  try {
    const userId = req.user._id;
    const query = { status: 'accepted', isActive: true };

    if (req.user.role === 'mentore') {
      query.mentore = userId;
    } else {
      query.mentoree = userId;
    }

    const mentorships = await MentorshipRequest.find(query)
      .populate('mentoree', 'name photo profession city')
      .populate('mentore', 'name photo profession expertise bio')
      .sort({ updatedAt: -1 });

    // Ajouter l'URL complète pour les photos
    const mentorshipsWithPhotoUrl = mentorships.map(mentorship => {
      const mentorshipObj = mentorship.toObject();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      if (mentorshipObj.mentore?.photo && !mentorshipObj.mentore.photo.startsWith('http')) {
        mentorshipObj.mentore.photo = `${baseUrl}/uploads/${mentorshipObj.mentore.photo.split('/').pop()}`;
      }
      if (mentorshipObj.mentoree?.photo && !mentorshipObj.mentoree.photo.startsWith('http')) {
        mentorshipObj.mentoree.photo = `${baseUrl}/uploads/${mentorshipObj.mentoree.photo.split('/').pop()}`;
      }
      return mentorshipObj;
    });

    res.json(mentorshipsWithPhotoUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques de mentorat
exports.getMentorshipStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'mentoree') {
      const [activeMentorships, pendingRequests, completedSessions] = await Promise.all([
        MentorshipRequest.countDocuments({ mentoree: userId, status: 'accepted', isActive: true }),
        MentorshipRequest.countDocuments({ mentoree: userId, status: 'pending' }),
        MentorshipRequest.countDocuments({ mentoree: userId, status: 'accepted', isActive: false })
      ]);

      stats = {
        activeMentorships,
        pendingRequests,
        completedSessions,
        totalHours: completedSessions * 2 // Estimation
      };
    } else if (userRole === 'mentore') {
      const [totalRequests, pendingRequests, acceptedRequests, totalSessions] = await Promise.all([
        MentorshipRequest.countDocuments({ mentore: userId }),
        MentorshipRequest.countDocuments({ mentore: userId, status: 'pending' }),
        MentorshipRequest.countDocuments({ mentore: userId, status: 'accepted' }),
        MentorshipRequest.countDocuments({ mentore: userId, status: 'accepted' })
      ]);

      stats = {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        totalSessions
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Terminer un mentorat
exports.endMentorship = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const request = await MentorshipRequest.findOneAndUpdate(
      {
        _id: requestId,
        $or: [{ mentore: req.user._id }, { mentoree: req.user._id }],
        status: 'accepted'
      },
      {
        isActive: false,
        endDate: new Date(),
        notes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['mentoree', 'mentore']);

    if (!request) {
      return res.status(404).json({ message: 'Mentorat non trouvé' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les séances de mentorat
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Récupérer les mentorats acceptés
    const query = { status: 'accepted' };
    if (userRole === 'mentore') {
      query.mentore = userId;
    } else {
      query.mentoree = userId;
    }

    const mentorships = await MentorshipRequest.find(query)
      .populate('mentoree', 'name photo profession')
      .populate('mentore', 'name photo profession')
      .sort({ createdAt: -1 });

    // Transformer en séances
    const sessions = mentorships.map((mentorship, index) => {
      console.log('Mentorat data:', {
        id: mentorship._id,
        sessionTopic: mentorship.sessionTopic,
        sessionScheduledDate: mentorship.sessionScheduledDate,
        sessionTime: mentorship.sessionTime,
        sessionDuration: mentorship.sessionDuration,
        sessionMode: mentorship.sessionMode
      });

      // Utiliser la vraie date si elle existe, sinon une date simulée
      let scheduledDate;
      if (mentorship.sessionScheduledDate) {
        scheduledDate = new Date(mentorship.sessionScheduledDate);
      } else {
        scheduledDate = new Date(mentorship.createdAt);
        scheduledDate.setDate(scheduledDate.getDate() + (7 + index * 2));
      }

      // Déterminer le statut basé sur les champs du mentorat
      let status = 'scheduled';
      if (mentorship.sessionStatus) {
        status = mentorship.sessionStatus;
      }

      return {
        _id: mentorship._id,
        mentore: mentorship.mentore,
        mentoree: mentorship.mentoree,
        topic: mentorship.sessionTopic || 'Séance de mentorat personnalisée',
        description: mentorship.sessionDescription || 'Séance de mentorat pour discuter de vos objectifs et défis professionnels.',
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: mentorship.sessionTime || '14:00',
        duration: mentorship.sessionDuration || 60,
        mode: mentorship.sessionMode || 'online',
        status: status,
        meetingLink: mentorship.sessionMeetingLink || null,
        notes: mentorship.message,
        resources: mentorship.sessionResources || [],
        confirmedAt: mentorship.confirmedAt,
        cancelledAt: mentorship.cancelledAt,
        createdAt: mentorship.createdAt
      };
    });

    // Ajouter l'URL complète pour les photos
    const sessionsWithPhotoUrl = sessions.map(session => {
      const sessionObj = { ...session };
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

// Confirmer la présence à une séance
exports.confirmSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    // Trouver le mentorat correspondant
    const mentorship = await MentorshipRequest.findById(sessionId);
    if (!mentorship) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    // Vérifier que l'utilisateur est autorisé
    if (mentorship.mentoree.toString() !== userId.toString() && mentorship.mentore.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Mettre à jour le statut
    mentorship.sessionStatus = 'confirmed';
    mentorship.confirmedAt = new Date();
    await mentorship.save();

    res.json({ message: 'Présence confirmée', mentorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Annuler une séance
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const mentorship = await MentorshipRequest.findById(sessionId);
    if (!mentorship) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (mentorship.mentore.toString() !== userId.toString() && mentorship.mentoree.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    mentorship.sessionStatus = 'cancelled';
    mentorship.cancelledAt = new Date();
    mentorship.cancelledBy = userId;
    await mentorship.save();

    res.json({ success: true, message: 'Séance annulée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const notifications = [];

    console.log('GetNotifications - User:', userId, 'Role:', userRole);

    // --- MESSAGES NON LUS (Commun à tous) ---
    const unreadMessages = await Message.find({
      recipient: userId,
      read: false
    }).populate('sender', 'name');

    // Grouper par expéditeur
    const messagesBySender = {};
    unreadMessages.forEach(msg => {
      if (msg.sender) { // Vérifier que l'expéditeur existe
        const senderId = msg.sender._id.toString();
        if (!messagesBySender[senderId]) {
          messagesBySender[senderId] = {
            senderName: msg.sender.name,
            count: 0,
            lastMessage: msg
          };
        }
        messagesBySender[senderId].count++;
      }
    });

    Object.values(messagesBySender).forEach(group => {
      notifications.push({
        id: `message_${group.lastMessage._id}`,
        type: 'message',
        title: 'Nouveau message',
        message: `Vous avez reçu ${group.count} message${group.count > 1 ? 's' : ''} de ${group.senderName}`,
        time: 'Récemment',
        data: { messageId: group.lastMessage._id }
      });
    });

    if (userRole === 'mentore') {
      // --- LOGIQUE MENTORE ---

      // Nouvelles demandes de mentorat
      const newRequests = await MentorshipRequest.countDocuments({
        mentore: userId,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
      });

      if (newRequests > 0) {
        notifications.push({
          id: 'new_requests',
          type: 'request',
          title: 'Nouvelles demandes',
          message: `${newRequests} nouvelle${newRequests > 1 ? 's' : ''} demande${newRequests > 1 ? 's' : ''} de mentorat`,
          time: 'Aujourd\'hui',
          count: newRequests,
          data: { status: 'pending' }
        });
      }

      // Séances à venir (mentore)
      const upcomingSessions = await MentorshipRequest.find({
        mentore: userId,
        status: 'accepted',
        sessionStatus: { $in: ['scheduled', 'confirmed'] }
      });

      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      upcomingSessions.forEach(session => {
        // Logique de date simulée (à adapter selon vos besoins réels)
        let sessionDate;
        if (session.sessionScheduledDate) {
          sessionDate = new Date(session.sessionScheduledDate);
        } else {
          sessionDate = new Date(session.createdAt);
          sessionDate.setDate(sessionDate.getDate() + 7);
        }

        if (sessionDate >= now && sessionDate <= twoHoursFromNow) {
          notifications.push({
            id: `session_${session._id}`,
            type: 'session',
            title: 'Séance à venir',
            message: 'Séance de mentorat dans moins de 2 heures',
            time: 'Bientôt',
            sessionId: session._id,
            data: { status: 'confirmed' }
          });
        }
      });

    } else if (userRole === 'mentoree') {
      // --- LOGIQUE MENTOREE ---

      // 1. Demandes acceptées ou refusées récemment (24h)
      const recentUpdates = await MentorshipRequest.find({
        mentoree: userId,
        status: { $in: ['accepted', 'rejected'] },
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate('mentore', 'name');

      recentUpdates.forEach(request => {
        notifications.push({
          id: `request_${request._id}`,
          type: 'request',
          title: request.status === 'accepted' ? 'Demande acceptée !' : 'Demande refusée',
          message: request.status === 'accepted'
            ? `Votre demande avec ${request.mentore?.name || 'votre mentor'} a été acceptée.`
            : `Votre demande avec ${request.mentore?.name || 'votre mentor'} a été refusée.`,
          time: 'Récemment',
          data: { status: request.status, requestId: request._id }
        });
      });

      // 2. Séances à venir (mentoree)
      const upcomingSessions = await MentorshipRequest.find({
        mentoree: userId,
        status: 'accepted',
        sessionStatus: { $in: ['scheduled', 'confirmed'] }
      });

      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      upcomingSessions.forEach(session => {
        let sessionDate;
        if (session.sessionScheduledDate) {
          sessionDate = new Date(session.sessionScheduledDate);
        } else {
          sessionDate = new Date(session.createdAt);
          sessionDate.setDate(sessionDate.getDate() + 7);
        }

        if (sessionDate >= now && sessionDate <= twoHoursFromNow) {
          notifications.push({
            id: `session_${session._id}`,
            type: 'session',
            title: 'Séance à venir',
            message: 'Séance de mentorat dans moins de 2 heures',
            time: 'Bientôt',
            sessionId: session._id,
            data: { status: 'confirmed' }
          });
        }
      });
    }

    res.json(notifications);
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le lien de réunion d'une séance
exports.updateSessionLink = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { meetingLink } = req.body;
    const userId = req.user._id;

    if (!meetingLink) {
      return res.status(400).json({ message: 'Lien de réunion requis' });
    }

    const mentorship = await MentorshipRequest.findById(sessionId);
    if (!mentorship) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (mentorship.mentore.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Seule la mentore peut modifier le lien' });
    }

    mentorship.sessionMeetingLink = meetingLink;
    mentorship.updatedAt = new Date();
    await mentorship.save();

    res.json({ success: true, message: 'Lien de réunion mis à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour les détails d'une séance
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { topic, scheduledDate, scheduledTime, duration, mode } = req.body;
    const userId = req.user._id;

    const mentorship = await MentorshipRequest.findById(sessionId);
    if (!mentorship) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (mentorship.mentore.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Seule la mentore peut modifier la séance' });
    }

    if (topic) mentorship.sessionTopic = topic;
    if (scheduledDate) mentorship.sessionScheduledDate = new Date(scheduledDate);
    if (scheduledTime) mentorship.sessionTime = scheduledTime;
    if (duration) mentorship.sessionDuration = duration;
    if (mode) mentorship.sessionMode = mode;

    mentorship.updatedAt = new Date();
    await mentorship.save();

    res.json({ success: true, message: 'Séance mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une séance comme terminée
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const mentorship = await MentorshipRequest.findById(sessionId);
    if (!mentorship) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (mentorship.mentore.toString() !== userId.toString() && mentorship.mentoree.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    mentorship.sessionStatus = 'completed';
    mentorship.completedAt = new Date();
    mentorship.updatedAt = new Date();
    await mentorship.save();

    res.json({ success: true, message: 'Séance marquée comme terminée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};