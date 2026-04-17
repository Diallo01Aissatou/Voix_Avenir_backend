const Resource = require('../models/Resource');
const { getGridFSBucket } = require('../config/gridfs');
const mongoose = require('mongoose');
const fs = require('fs');

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
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        required: ['title', 'description', 'category', 'type']
      });
    }

    // Gérer l'image
    if (req.files && req.files.image) {
      resourceData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Gérer le fichier de ressource avec GridFS
    if (req.files && req.files.resourceFile) {
      const file = req.files.resourceFile[0];
      const bucket = getGridFSBucket();
      
      if (!bucket) {
        throw new Error('Le stockage GridFS n\'est pas encore prêt.');
      }

      const uploadStream = bucket.openUploadStream(
        `resource-${Date.now()}-${file.originalname}`,
        { contentType: file.mimetype }
      );

      const readStream = fs.createReadStream(file.path);

      await new Promise((resolve, reject) => {
        readStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Supprimer le fichier temporaire du disque après upload en GridFS
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Erreur lors de la suppression du fichier temporaire:', err);
      }

      // Stocker l'ID du fichier GridFS dans fileUrl
      resourceData.fileUrl = `/api/resources/serve-file/${uploadStream.id}`;
      console.log('Fichier de ressource sauvegardé en GridFS:', resourceData.fileUrl);
    } else {
      console.log('Aucun fichier de ressource reçu');
    }

    console.log('Données finales:', resourceData);

    const resource = await Resource.create(resourceData);
    console.log('Ressource créée:', resource);

    res.status(201).json({ message: 'Ressource ajoutée avec succès', resource });
  } catch (error) {
    console.error('Erreur lors de la création de ressource:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message,
      details: error.stack
    });
  }
};

// Mettre à jour une ressource (admin)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    let resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    const updateData = req.body;

    // Gérer l'image si fournie
    if (req.files && req.files.image) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Gérer le fichier de ressource si fourni avec GridFS
    if (req.files && req.files.resourceFile) {
      const file = req.files.resourceFile[0];
      const bucket = getGridFSBucket();
      
      const uploadStream = bucket.openUploadStream(
        `resource-${Date.now()}-${file.originalname}`,
        { contentType: file.mimetype }
      );

      const readStream = fs.createReadStream(file.path);

      await new Promise((resolve, reject) => {
        readStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Supprimer le fichier temporaire
      try { fs.unlinkSync(file.path); } catch (e) {}

      updateData.fileUrl = `/api/resources/serve-file/${uploadStream.id}`;
    }

    resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ message: 'Ressource mise à jour avec succès', resource });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de ressource:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une ressource (admin)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
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
    
    // Sécurité et accessibilité pour l'affichage en ligne (iframe)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Forcer le Content-Type s'il est mal détecté ou générique
    let contentType = file.contentType || 'application/octet-stream';
    const extension = file.filename.split('.').pop().toLowerCase();
    
    if (extension === 'pdf') {
      contentType = 'application/pdf';
    } else if (['mp4', 'm4v', 'mov', 'webm'].includes(extension)) {
      contentType = `video/${extension === 'mov' ? 'quicktime' : extension}`;
    }

    // Headers ULTIMES pour forcer l'affichage sans téléchargement
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    } else {
      // Pour l'affichage natif, 'inline' sans filename est la norme la plus sûre
      res.setHeader('Content-Disposition', 'inline');
    }

    // Incrémenter les compteurs selon le besoin (on peut utiliser l'ID de la ressource passé en query)
    if (req.query.resourceId) {
      await Resource.findByIdAndUpdate(req.query.resourceId, { $inc: isDownload ? { downloadCount: 1 } : { views: 1 } });
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