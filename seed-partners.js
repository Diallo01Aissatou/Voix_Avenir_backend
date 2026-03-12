const mongoose = require('mongoose');
const Partner = require('./models/Partner');

// Configuration de la base de données
mongoose.connect('mongodb://localhost:27017/mentorat-gn', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function seedPartners() {
  try {
    console.log('🌱 Ajout de partenaires par défaut...\n');

    // Supprimer les anciens partenaires
    await Partner.deleteMany({});
    console.log('✅ Anciens partenaires supprimés');

    // Créer des partenaires par défaut
    const defaultPartners = [
      {
        name: "ONU Femmes",
        logo: "🇺🇳",
        website: "https://www.unwomen.org",
        description: "Organisation des Nations Unies pour l'égalité des sexes et l'autonomisation des femmes",
        isActive: true
      },
      {
        name: "Ministère de l'Éducation",
        logo: "🏛️",
        website: "",
        description: "Ministère de l'Éducation Nationale de Guinée",
        isActive: true
      },
      {
        name: "Orange Guinée",
        logo: "🍊",
        website: "https://www.orange.gn",
        description: "Opérateur de télécommunications leader en Guinée",
        isActive: true
      },
      {
        name: "Banque Mondiale",
        logo: "🏦",
        website: "https://www.worldbank.org",
        description: "Institution financière internationale pour le développement",
        isActive: true
      },
      {
        name: "UNICEF Guinée",
        logo: "🦄",
        website: "https://www.unicef.org/guinea",
        description: "Fonds des Nations Unies pour l'enfance",
        isActive: true
      },
      {
        name: "Plan International",
        logo: "🌍",
        website: "https://plan-international.org",
        description: "Organisation humanitaire pour les droits des enfants et l'égalité des filles",
        isActive: true
      }
    ];

    // Insérer les partenaires
    const createdPartners = await Partner.insertMany(defaultPartners);
    
    console.log(`✅ ${createdPartners.length} partenaires créés avec succès :`);
    createdPartners.forEach((partner, index) => {
      console.log(`   ${index + 1}. ${partner.name} (${partner.logo})`);
    });

    console.log('\n🎉 Partenaires par défaut ajoutés avec succès !');
    console.log('✅ Les partenaires sont maintenant disponibles sur la page d\'accueil');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des partenaires:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Exécuter le script
seedPartners();