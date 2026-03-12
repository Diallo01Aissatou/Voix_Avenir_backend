const Message = require('../models/Message');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads/messages s'il n'existe pas
const uploadsDir = path.join(__dirname, '..', 'uploads', 'messages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration multer pour les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `message-${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Envoyer un message avec fichier optionnel
exports.sendMessage = [upload.single('file'), async (req, res) => {
  try {
    const { recipient, content, mentorshipId } = req.body;
    
    // Vérifier si c'est un mentorat actif
    if (mentorshipId) {
      const MentorshipRequest = require('../models/MentorshipRequest');
      const mentorship = await MentorshipRequest.findOne({
        _id: mentorshipId,
        status: 'accepted',
        isActive: true,
        $or: [
          { mentore: req.user._id },
          { mentoree: req.user._id }
        ]
      });

      if (!mentorship) {
        return res.status(403).json({ 
          message: 'Vous ne pouvez pas envoyer de message dans ce mentorat' 
        });
      }
    }

    const messageData = {
      sender: req.user._id,
      recipient,
      content: content || '',
      timestamp: new Date(),
      mentorshipId: mentorshipId || undefined
    };

    // Ajouter les informations du fichier si présent
    if (req.file) {
      messageData.fileUrl = `/uploads/messages/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileType = req.file.mimetype;
      messageData.messageType = 'file';
    }

    const message = await Message.create(messageData);
    
    // Populate pour retourner les informations complètes
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name photo')
      .populate('recipient', 'name photo');

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Erreur envoi message:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}];

// Récupérer les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { mentorshipId } = req.query;
    
    let query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    };

    // Si c'est dans le contexte d'un mentorat, filtrer par mentorshipId
    if (mentorshipId) {
      query.mentorshipId = mentorshipId;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name photo')
      .populate('recipient', 'name photo')
      .sort({ timestamp: 1 });

    // Marquer les messages comme lus
    await Message.updateMany(
      { 
        sender: userId, 
        recipient: req.user._id, 
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.json(messages);
  } catch (err) {
    console.error('Erreur récupération messages:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Signaler un message
exports.reportMessage = async (req, res) => {
  try {
    const { messageId, reason } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    message.isReported = true;
    message.reportReason = reason;
    message.reportedBy = req.user._id;
    message.reportedAt = new Date();
    
    await message.save();
    
    res.json({ message: 'Message signalé avec succès' });
  } catch (err) {
    console.error('Erreur signalement:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Obtenir les conversations de l'utilisateur
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const populatedConversations = await User.populate(conversations, {
      path: '_id',
      select: 'name photo'
    });

    res.json(populatedConversations);
  } catch (err) {
    console.error('Erreur conversations:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Obtenir les conversations de mentorat actives
exports.getMentorshipConversations = async (req, res) => {
  try {
    const MentorshipRequest = require('../models/MentorshipRequest');
    const userId = req.user._id;
    const userRole = req.user.role;

    // Trouver les mentorships actifs
    let query = { status: 'accepted' };
    if (userRole === 'mentore') {
      query.mentore = userId;
    } else {
      query.mentoree = userId;
    }

    const activeMentorships = await MentorshipRequest.find(query)
      .populate('mentoree', 'name photo')
      .populate('mentore', 'name photo');

    // Pour chaque mentorship, obtenir le dernier message
    const conversations = await Promise.all(
      activeMentorships.map(async (mentorship) => {
        const otherUserId = userRole === 'mentore' ? mentorship.mentoree._id : mentorship.mentore._id;
        const otherUser = userRole === 'mentore' ? mentorship.mentoree : mentorship.mentore;
        
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, recipient: otherUserId },
            { sender: otherUserId, recipient: userId }
          ]
        }).sort({ timestamp: -1 });

        return {
          user: otherUser,
          lastMessage,
          mentorshipId: mentorship._id
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Erreur conversations mentorat:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Ancienne méthode pour compatibilité
exports.getConversation = exports.getMessages;
