require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MentorshipRequest = require('./models/MentorshipRequest');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connecté à la DB');
        
        console.log('\n--- TOUTES LES DEMANDES DE MENTORAT ---');
        const requests = await MentorshipRequest.find({})
            .populate('mentore')
            .populate('mentoree');
        
        console.log(`Nombre de demandes: ${requests.length}`);
        
        for (const req of requests) {
            console.log(`\nDemande ID: ${req._id}`);
            console.log(`Statut: ${req.status}`);
            console.log(`Message: ${req.message}`);
            
            console.log(`Mentoré:`);
            if (req.mentoree) {
                console.log(`  - ID: ${req.mentoree._id}`);
                console.log(`  - Nom: ${req.mentoree.name}`);
                console.log(`  - Rôle: ${req.mentoree.role}`);
            } else {
                console.log('  - (NULL)');
            }
            
            console.log(`Mentor:`);
            if (req.mentore) {
                console.log(`  - ID: ${req.mentore._id}`);
                console.log(`  - Nom: ${req.mentore.name}`);
                console.log(`  - Rôle: ${req.mentore.role}`);
                console.log(`  - Ville: "${req.mentore.city}"`);
                console.log(`  - Expertise: ${JSON.stringify(req.mentore.expertise)}`);
                console.log(`  - Photo: ${req.mentore.photo ? req.mentore.photo.substring(0, 50) + '...' : 'NULL'}`);
            } else {
                console.log('  - (NULL)');
            }
        }
        
        console.log('\n--- COMPTES DE COMPTE MENTOR ---');
        const mentors = await User.find({ role: 'mentore' });
        console.log(`Nombre de mentors: ${mentors.length}`);
        mentors.forEach(m => {
            console.log(`  - Name: ${m.name}, ID: ${m._id}, City: ${m.city}, Expertise: ${JSON.stringify(m.expertise)}`);
        });

        process.exit();
    })
    .catch(err => {
        console.error('Erreur DB:', err);
        process.exit();
    });
