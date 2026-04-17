const mongoose = require('mongoose');

let gridFSBucket;

const initGridFS = (db) => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'resources'
  });
  console.log("GridFS Bucket initialisé ✅");
  return gridFSBucket;
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    // Essayer de récupérer depuis la connexion mongoose par défaut si non encore initialisé
    if (mongoose.connection && mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'resources'
      });
      return gridFSBucket;
    }
  }
  return gridFSBucket;
};

module.exports = { initGridFS, getGridFSBucket };
