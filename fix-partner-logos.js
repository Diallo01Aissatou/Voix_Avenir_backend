const mongoose = require('mongoose');
const Partner = require('./models/Partner');
require('dotenv').config();

async function migratePartners() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connecté à MongoDB ✅');

    const partners = await Partner.find({});
    let updatedCount = 0;

    for (const partner of partners) {
      if (partner.logo && partner.logo.startsWith('/uploads/') && !partner.logo.startsWith('/uploads/partners/')) {
        const oldLogo = partner.logo;
        partner.logo = partner.logo.replace('/uploads/', '/uploads/partners/');
        await partner.save();
        console.log(`Mis à jour ${partner.name}: ${oldLogo} -> ${partner.logo}`);
        updatedCount++;
      }
    }

    console.log(`Migration terminée. ${updatedCount} partenaires mis à jour.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur migration:', error);
    process.exit(1);
  }
}

migratePartners();
