const dns = require('dns');
dns.setServers(['8.8.8.8']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MentorshipRequest = require('./models/MentorshipRequest');

// Modify the connection string to target voix_avenir_db
const baseURI = process.env.MONGO_URI || process.env.MONGODB_URI;
const mongoURI = baseURI.replace('voixavenir.nmv0roe.mongodb.net/?', 'voixavenir.nmv0roe.mongodb.net/voix_avenir_db?');

console.log('Connecting to MongoDB database voix_avenir_db...');
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to DB:', mongoose.connection.name);
        
        console.log('\n--- ALL MENTORSHIP REQUESTS ---');
        const requests = await MentorshipRequest.find({})
            .populate('mentore')
            .populate('mentoree');
        
        console.log(`Number of requests: ${requests.length}`);
        
        for (const req of requests) {
            console.log(`\nDemande ID: ${req._id}`);
            console.log(`Statut: ${req.status}`);
            console.log(`Message: ${req.message}`);
            
            console.log(`Mentoree:`);
            if (req.mentoree) {
                console.log(`  - ID: ${req.mentoree._id}`);
                console.log(`  - Nom: ${req.mentoree.name}`);
                console.log(`  - Photo: ${req.mentoree.photo ? req.mentoree.photo.substring(0, 50) + '...' : 'NULL'}`);
            } else {
                console.log('  - (NULL)');
            }
            
            console.log(`Mentore:`);
            if (req.mentore) {
                console.log(`  - ID: ${req.mentore._id}`);
                console.log(`  - Nom: ${req.mentore.name}`);
                console.log(`  - Ville: "${req.mentore.city}"`);
                console.log(`  - Expertise: ${JSON.stringify(req.mentore.expertise)}`);
                console.log(`  - Photo: ${req.mentore.photo ? req.mentore.photo.substring(0, 50) + '...' : 'NULL'}`);
            } else {
                console.log('  - (NULL)');
            }
        }
        
        process.exit();
    })
    .catch(err => {
        console.error('DB Error:', err);
        process.exit();
    });
