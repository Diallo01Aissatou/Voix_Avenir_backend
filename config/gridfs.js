const mongoose = require('mongoose');

let gridFSBucket;

const initGridFS = (db) => {
  if (!db) {
    console.error("Tentative d'initialisation de GridFS sans base de données ! ❌");
    return null;
  }
  gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'resources'
  });
  console.log("GridFS Bucket initialisé avec succès ✅");
  return gridFSBucket;
};

const getGridFSBucket = () => {
  // Si le bucket existe déjà, on le renvoie
  if (gridFSBucket) return gridFSBucket;

  // Sinon, on essaie de le créer à la volée depuis la connexion active de Mongoose
  if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    console.log("Initialisation dynamique du bucket GridFS... 🔄");
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resources'
    });
    return gridFSBucket;
  }

  console.warn("GridFS Bucket non disponible (Base de données non connectée) ⚠️");
  return null;
};

module.exports = { initGridFS, getGridFSBucket };
