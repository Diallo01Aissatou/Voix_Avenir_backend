const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    console.error('MongoDB non connecté:', err.message);
    // Continuer sans MongoDB pour les tests
  }
};

module.exports = connectDB;
