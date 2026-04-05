require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        const users = await User.find({}, 'email name');
        let output = 'Liste des utilisateurs:\n';
        users.forEach(u => output += `- ${u.email} (${u.name})\n`);
        fs.writeFileSync('all-users.txt', output);
        console.log('Fichier all-users.txt créé');
        process.exit();
    })
    .catch(err => {
        console.error('Erreur DB:', err);
        process.exit();
    });
