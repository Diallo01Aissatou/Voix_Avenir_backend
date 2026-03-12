require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const adminData = {
    name: 'Administrateur',
    email: 'admin@mentorat.gn',
    password: 'Admin@123',
    role: 'admin',
    city: 'Conakry',
    verified: true
};

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mentorat-gn');
        console.log('Connecté à MongoDB');

        const existing = await User.findOne({ email: adminData.email });
        if (existing) {
            console.log('Un admin avec cet email existe déjà :', adminData.email);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const admin = await User.create({ ...adminData, password: hashedPassword });

        console.log('✅ Admin créé avec succès !');
        console.log('Email     :', adminData.email);
        console.log('Mot de passe :', adminData.password);
        console.log('ID        :', admin._id);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err.message);
        process.exit(1);
    }
}

createAdmin();
