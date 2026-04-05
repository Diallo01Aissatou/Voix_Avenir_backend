require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connecté à la DB');
        const user = await User.findOne({ email: 'hadiadiallo44444@gmail.com' });
        if (user) {
            console.log('Utilisateur trouvé:', user.email);
        } else {
            console.log('Utilisateur NON trouvé: hadiadiallo44444@gmail.com');
        }
        process.exit();
    })
    .catch(err => {
        console.error('Erreur DB:', err);
        process.exit();
    });
