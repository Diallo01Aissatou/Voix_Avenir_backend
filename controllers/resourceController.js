const Resource = require('../models/Resource');
const { getGridFSBucket } = require('../config/gridfs');
const mongoose = require('mongoose');
const fs = require('fs');
const { uploadToGridFS, deleteFromGridFS } = require('../utils/gridfsUtils');

// Obtenir toutes les ressources actives
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ isActive: true }).sort('-createdAt');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle ressource (admin)
exports.createResource = async (req, res) => {
  try {
    console.log('Body reçu:', req.body);
    console.log('Fichiers reçus:', req.files);

    const resourceData = req.body;

    // Vérifier les champs obligatoires
    if (!resourceData.title || !resourceData.description || !resourceData.category || !resourceData.type) {
      // Nettoyage préventif des fichiers si erreur
      if (req.files) {
        Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      }
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        required: ['title', 'description', 'category', 'type']
      });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      // Nettoyage si la DB n'est pas prête
      if (req.files) {
        Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      }
      return res.status(503).json({ message: 'Le stockage permanent (GridFS) n\'est pas encore prêt. Veuillez réessayer dans quelques instants.' });
    }

    // Gérer l'image avec GridFS
    if (req.files && req.files.image) {
      const imageFile = req.files.image[0];
      resourceData.image = await uploadToGridFS(imageFile.path, `image-${Date.now()}-${imageFile.originalname}`, imageFile.mimetype);
      console.log('Image sauvegardée définitivement en GridFS:', resourceData.image);
    }

    // Gérer le fichier de ressource avec GridFS
    if (req.files && req.files.resourceFile) {
      const file = req.files.resourceFile[0];
      resourceData.fileUrl = await uploadToGridFS(file.path, `resource-${Date.now()}-${file.originalname}`, file.mimetype);
      console.log('Fichier de ressource sauvegardé définitivement en GridFS:', resourceData.fileUrl);
    } else {
      console.log('Aucun fichier de ressource reçu');
    }

    const resource = await Resource.create(resourceData);
    console.log('Ressource créée en base:', resource);

    res.status(201).json({ message: 'Ressource ajoutée avec succès et stockée en base de données', resource });
  } catch (error) {
    console.error('Erreur lors de la création de ressource:', error);
    // Nettoyage en cas d'erreur critique
    if (req.files) {
      Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
    }
    res.status(500).json({
      message: 'Erreur serveur lors de l\'enregistrement permanent',
      error: error.message
    });
  }
};

// Mettre à jour une ressource (admin)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    let resource = await Resource.findById(id);

    if (!resource) {
      // Nettoyage si ressource non trouvée
      if (req.files) {
        Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      }
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    const updateData = req.body;
    const bucket = getGridFSBucket();

    if (!bucket) {
      if (req.files) {
        Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      }
      return res.status(503).json({ message: 'Le stockage permanent (GridFS) n\'est pas encore prêt.' });
    }

    // Nouvelle image ?
    if (req.files && req.files.image) {
      const imageFile = req.files.image[0];
      // Supprimer l'ancienne image si elle existe
      if (resource.image) await deleteFromGridFS(resource.image);
      updateData.image = await uploadToGridFS(imageFile.path, `image-${Date.now()}-${imageFile.originalname}`, imageFile.mimetype);
    }

    // Nouveau fichier de ressource ?
    if (req.files && req.files.resourceFile) {
      const file = req.files.resourceFile[0];
      // Supprimer l'ancien fichier si il existe
      if (resource.fileUrl) await deleteFromGridFS(resource.fileUrl);
      updateData.fileUrl = await uploadToGridFS(file.path, `resource-${Date.now()}-${file.originalname}`, file.mimetype);
    }

    resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ message: 'Ressource mise à jour avec succès (Stockage permanent OK)', resource });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de ressource:', error);
    if (req.files) {
      Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une ressource (admin)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    
    if (resource) {
      const bucket = getGridFSBucket();
      // Optionnel : Supprimer les fichiers correspondants dans GridFS pour libérer de l'espace
      try {
        if (resource.fileUrl) await deleteFromGridFS(resource.fileUrl);
        if (resource.image) await deleteFromGridFS(resource.image);
      } catch (e) {
        console.warn('Erreur lors de la suppression des fichiers GridFS:', e.message);
      }
    }

    await Resource.findByIdAndDelete(id);
    res.json({ message: 'Ressource supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le statut vedette (admin)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    resource.isFeatured = !resource.isFeatured;
    await resource.save();

    res.json({ message: 'Statut vedette mis à jour', resource });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Incrémenter le compteur de téléchargements
exports.incrementDownload = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    res.json({ message: 'Compteur mis à jour', downloadCount: resource.downloadCount });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Incrémenter le compteur de vues/consultations
exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    res.json({ message: 'Compteur de vues mis à jour', views: resource.views });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Servir/Télécharger un fichier depuis GridFS
exports.serveFile = async (req, res) => {
  try {
    const { id } = req.params;
    const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).json({ message: 'Serveur de stockage non prêt' });
    }

    let fileId;
    try {
      fileId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      return res.status(400).json({ message: 'ID de fichier invalide' });
    }

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Fichier non trouvé en base de données' });
    }

    const file = files[0];
    
    // Déterminer si c'est un téléchargement forcé ou un affichage inline
    const isDownload = req.query.download === 'true';
    
    // Forcer le Content-Type s'il est mal détecté ou générique
    let contentType = file.contentType || 'application/octet-stream';
    const extension = file.filename.split('.').pop().toLowerCase();
    
    // Mappage robuste des types MIME
    const mimeTypes = {
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };

    if (mimeTypes[extension]) {
      contentType = mimeTypes[extension];
    }

    // Headers pour l'affichage/téléchargement
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache longue durée pour les fichiers immutables
    
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }

    // Optionnel : Incrémenter les compteurs si resourceId est fourni
    if (req.query.resourceId) {
      Resource.findByIdAndUpdate(req.query.resourceId, { 
        $inc: isDownload ? { downloadCount: 1 } : { views: 1 } 
      }).catch(err => console.error('Erreur incrément compteur:', err));
    }

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);


  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Garder l'ancienne méthode pour compatibilité mais la rediriger si besoin
exports.downloadFile = async (req, res) => {
  // Cette méthode peut être gardée pour gérer les anciennes routes ou rediriger vers serveFile
  const { id } = req.params;
  const resource = await Resource.findById(id);
  if (resource && resource.fileUrl && resource.fileUrl.includes('/serve-file/')) {
    const fileId = resource.fileUrl.split('/').pop();
    req.params.id = fileId;
    req.query.download = 'true';
    req.query.resourceId = id;
    return exports.serveFile(req, res);
  }
  
  // Fallback sur l'ancien code si fichier local (probable qu'il n'existe plus)
  // ... (code original simplifié ou supprimé)
  res.status(404).json({ message: "Le fichier n'est plus disponible sur ce serveur." });
};

function getFileExtension(type) {
  switch (type) {
    case 'pdf': return 'pdf';
    case 'video': return 'mp4';
    case 'article': return 'html';
    case 'guide': return 'pdf';
    default: return 'file';
  }
}