require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fixAdmin() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connexion à:', uri);
        await mongoose.connect(uri);
        console.log('Connecté à MongoDB ✅');

        await User.deleteOne({ email: 'admin@mentorat.gn' });
        console.log('Ancien admin supprimé (si existant)');

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const admin = await User.create({
            name: 'Administrateur',
            email: 'admin@mentorat.gn',
            password: hashedPassword,
            role: 'admin',
            city: 'Conakry',
            verified: true
        });

        const test = await bcrypt.compare('Admin@123', admin.password);
        console.log('✅ Admin créé avec succès !');
        console.log('Vérification hash:', test ? 'OK ✅' : 'ERREUR ❌');
        console.log('Email :       admin@mentorat.gn');
        console.log('Mot de passe: Admin@123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
}

fixAdmin();
