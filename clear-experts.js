require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('./models/Expert');

async function clearExperts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB ✅');

        const count = await Expert.countDocuments();
        console.log(`Nombre d'expertes à supprimer : ${count}`);

        await Expert.deleteMany({});
        console.log('✅ Toutes les données statiques des expertes ont été supprimées !');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
}

clearExperts();
