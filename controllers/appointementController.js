const Appointment = require('../models/Appointement');
const User = require('../models/User');
const Session = require('../models/Session');
const mongoose = require('mongoose');



exports.requestAppointment = async (req, res) => {
  try {
    const { mentor, notes, scheduledAt } = req.body;

    console.log('Création demande:', {
      mentee: req.user._id,
      mentor,
      notes,
      scheduledAt
    });

    const appt = await Appointment.create({
      mentee: req.user._id,
      mentor,
      notes: notes || '',
      scheduledAt: scheduledAt || new Date(),
      status: 'pending'
    });

    // Peupler les données pour la réponse
    const populatedAppt = await Appointment.findById(appt._id)
      .populate('mentee', 'name email city age level interests')
      .populate('mentor', 'name profession');

    res.status(201).json({
      message: 'Demande envoyée avec succès',
      appointment: populatedAppt
    });
  } catch (err) {
    console.error('Erreur création demande:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    // admins can see all, mentors/mentees only theirs
    if (req.user.role === 'admin') {
      const appts = await Appointment.find().populate('mentee mentor').sort('-requestedAt');
      return res.json(appts);
    }
    const appts = await Appointment.find({
      $or: [{ mentee: req.user._id }, { mentor: req.user._id }]
    }).populate('mentee mentor').sort('-requestedAt');
    res.json(appts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Obtenir les demandes envoyées par l'utilisateur connecté (mentorée)
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Appointment.find({ mentee: req.user._id })
      .populate('mentor', 'name profession photo')
      .sort('-requestedAt');

    // Formater les données pour le frontend
    const formattedRequests = requests.map(request => {
      const mentorObj = request.mentor?.toObject ? request.mentor.toObject() : request.mentor;
      if (mentorObj?.photo && !mentorObj.photo.startsWith('http')) {
        const baseUrl = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
        mentorObj.photo = `${baseUrl}/uploads/${mentorObj.photo.split('/').pop()}`;
      }

      return {
        id: request._id,
        message: request.notes,
        status: request.status,
        createdAt: request.requestedAt,
        mentore: {
          name: mentorObj?.name,
          profession: mentorObj?.profession,
          photo: mentorObj?.photo
        }
      };
    });

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meetingLink } = req.body;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    // only mentor or admin can accept/refuse
    if (req.user.role !== 'admin' && String(req.user._id) !== String(appt.mentor)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (status) appt.status = status;
    if (meetingLink) appt.meetingLink = meetingLink;
    await appt.save();
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Obtenir les demandes reçues par une mentore
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await Appointment.find({ mentor: req.user._id })
      .populate('mentee', 'name email city age level interests photo')
      .sort('-requestedAt');

    console.log('Demandes reçues pour mentore:', requests.length);

    // Formater les données pour le frontend
    const formattedRequests = requests.map(request => ({
      id: request._id,
      message: request.notes,
      status: request.status,
      createdAt: request.requestedAt || request.createdAt,
      mentee: {
        id: request.mentee?._id,
        name: request.mentee?.name,
        email: request.mentee?.email,
        city: request.mentee?.city,
        age: request.mentee?.age,
        level: request.mentee?.level,
        interests: request.mentee?.interests,
        photo: request.mentee?.photo
      }
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Erreur getReceivedRequests:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les statistiques des demandes pour une mentorée
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Appointment.aggregate([
      { $match: { mentee: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      activeMentorships: 0,
      pendingRequests: 0,
      completedSessions: 0,
      totalHours: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'accepted') result.activeMentorships = stat.count;
      if (stat._id === 'pending') result.pendingRequests = stat.count;
    });

    // Compter les séances terminées et heures totales
    const sessions = await Session.find({ mentee: userId });
    result.completedSessions = sessions.filter(s => s.status === 'completed').length;
    result.totalHours = sessions.reduce((total, session) => {
      return session.status === 'completed' ? total + (session.duration / 60) : total;
    }, 0);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les demandes reçues par une mentore
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await Appointment.find({ mentor: req.user._id })
      .populate('mentee', 'name age city level interests bio photo')
      .sort('-requestedAt');

    const formattedRequests = requests.map(request => {
      const userObj = request.mentee?.toObject ? request.mentee.toObject() : request.mentee;
      if (userObj?.photo && !userObj.photo.startsWith('http')) {
        const baseUrl = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
        userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
      }

      return {
        id: request._id,
        message: request.notes,
        status: request.status,
        createdAt: request.requestedAt,
        mentoree: {
          id: userObj?._id,
          name: userObj?.name,
          age: userObj?.age,
          city: userObj?.city,
          level: userObj?.level,
          interests: userObj?.interests,
          bio: userObj?.bio,
          photo: userObj?.photo
        }
      };
    });

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les statistiques pour une mentore
exports.getMentorStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Appointment.aggregate([
      { $match: { mentor: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalMentorees: 0,
      pendingRequests: 0,
      activeSessions: 0,
      totalHours: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'accepted') {
        result.totalMentorees = stat.count;
      }
      if (stat._id === 'pending') result.pendingRequests = stat.count;
    });

    // Compter les séances actives et heures totales
    const sessions = await Session.find({ mentor: userId });
    result.activeSessions = sessions.filter(s => s.status === 'scheduled').length;
    result.totalHours = sessions.reduce((total, session) => {
      return session.status === 'completed' ? total + (session.duration / 60) : total;
    }, 0);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Accepter ou refuser une demande
exports.respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (String(appointment.mentor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: `Demande ${status === 'accepted' ? 'acceptée' : 'refusée'}`, appointment });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les séances d'une mentorée
exports.getMenteeSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ mentee: req.user._id })
      .populate('mentor', 'name photo profession')
      .sort('scheduledDate');

    const formattedSessions = sessions.map(session => {
      const userObj = session.mentor?.toObject ? session.mentor.toObject() : session.mentor;
      if (userObj?.photo && !userObj.photo.startsWith('http')) {
        const baseUrl = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
        userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
      }

      return {
        id: session._id,
        mentorName: userObj?.name,
        mentorPhoto: userObj?.photo,
        mentorProfession: userObj?.profession,
        date: session.scheduledDate.toISOString().split('T')[0],
        time: session.scheduledDate.toTimeString().slice(0, 5),
        topic: session.topic,
        status: session.status,
        duration: session.duration,
        meetingLink: session.meetingLink
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les séances d'une mentore
exports.getMentorSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ mentor: req.user._id })
      .populate('mentee', 'name photo')
      .sort('scheduledDate');

    const formattedSessions = sessions.map(session => {
      const userObj = session.mentee?.toObject ? session.mentee.toObject() : session.mentee;
      if (userObj?.photo && !userObj.photo.startsWith('http')) {
        const baseUrl = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
        userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
      }

      return {
        id: session._id,
        mentoreeName: userObj?.name,
        menteePhoto: userObj?.photo,
        date: session.scheduledDate.toISOString().split('T')[0],
        time: session.scheduledDate.toTimeString().slice(0, 5),
        topic: session.topic,
        status: session.status,
        duration: session.duration,
        meetingLink: session.meetingLink
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle séance
exports.createSession = async (req, res) => {
  try {
    const { menteeId, appointmentId, scheduledDate, topic, duration } = req.body;

    const session = await Session.create({
      mentor: req.user._id,
      mentee: menteeId,
      appointment: appointmentId,
      scheduledDate: new Date(scheduledDate),
      topic,
      duration: duration || 60
    });

    res.status(201).json({ message: 'Séance créée avec succès', session });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
