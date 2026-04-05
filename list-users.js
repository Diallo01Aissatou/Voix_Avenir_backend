require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connecté à la DB');
        const users = await User.find({}, 'email name').limit(10);
        console.log('Liste des utilisateurs:');
        users.forEach(u => console.log(`- ${u.email}`));
        process.exit();
    })
    .catch(err => {
        console.error('Erreur DB:', err);
        process.exit();
    });
