const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middlewares/auth');

// Récupérer les conversations de l'utilisateur connecté
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    if (!userId) {
      return res.status(400).json({ error: 'Utilisateur non identifié' });
    }
    
    // Récupérer tous les messages où l'utilisateur est expéditeur ou destinataire
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
    .populate('sender', 'name photo role profession')
    .populate('recipient', 'name photo role profession')
    .sort({ timestamp: -1 });

    // Grouper par conversation (utilisateur unique)
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      if (!message.sender || !message.recipient) return;
      
      const otherUserId = message.sender._id.toString() === userId.toString() ? 
        message.recipient._id.toString() : message.sender._id.toString();
      
      const otherUser = message.sender._id.toString() === userId.toString() ? 
        message.recipient : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          _id: `conv_${otherUserId}`,
          user: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    // Calculer les messages non lus pour chaque conversation
    for (let [otherUserId, conversation] of conversationsMap) {
      try {
        const unreadCount = await Message.countDocuments({
          sender: otherUserId,
          recipient: userId,
          read: false
        });
        conversation.unreadCount = unreadCount;
      } catch (err) {
        console.error('Erreur comptage messages non lus:', err);
        conversation.unreadCount = 0;
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Récupérer les messages d'une conversation spécifique
router.get('/:userId', protect, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const otherUserId = req.params.userId;

    if (!currentUserId || !otherUserId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name photo role profession')
    .populate('recipient', 'name photo role profession')
    .sort({ timestamp: 1 });

    // Marquer les messages reçus comme lus
    try {
      await Message.updateMany(
        { sender: otherUserId, recipient: currentUserId, read: false },
        { read: true, readAt: new Date() }
      );
    } catch (updateError) {
      console.error('Erreur mise à jour statut lu:', updateError);
    }

    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Envoyer un message
router.post('/', protect, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const senderId = req.user.id || req.user._id;

    if (!senderId) {
      return res.status(400).json({ error: 'Utilisateur non identifié' });
    }

    if (!recipient || !content?.trim()) {
      return res.status(400).json({ error: 'Destinataire et contenu requis' });
    }

    // Vérifier que le destinataire existe
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ error: 'Destinataire introuvable' });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipient,
      content: content.trim(),
      timestamp: new Date()
    });

    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name photo role profession')
      .populate('recipient', 'name photo role profession');

    res.json(populatedMessage);
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Récupérer les utilisateurs disponibles selon le rôle pour conversations mentore-mentoree
router.get('/users/available', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const currentUserRole = req.user.role;
    
    // Les mentores peuvent parler aux mentorees et vice versa
    let targetRole;
    if (currentUserRole === 'mentore') {
      targetRole = 'mentoree';
    } else if (currentUserRole === 'mentoree') {
      targetRole = 'mentore';
    } else {
      // Pour les admins, permettre de parler à tous
      targetRole = { $in: ['mentore', 'mentoree'] };
    }
    
    const users = await User.find({ 
      _id: { $ne: currentUserId },
      role: targetRole
    })
    .select('name photo role profession expertise')
    .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;