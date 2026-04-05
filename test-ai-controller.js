require('dotenv').config();
const mongoose = require('mongoose');
const aiController = require('./controllers/aiController');

async function test() {
    try {
        console.log("Connexion à la base de données...");
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("DB Connectée. Test de l'aiController...");

        const req = {
            body: {
                messages: [
                    { role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider ?' },
                    { role: 'user', content: 'Que fais-tu ici ?' }
                ]
            }
        };

        const res = {
            status: (code) => {
                console.log("RES.STATUS:", code);
                return res;
            },
            json: (data) => {
                require('fs').writeFileSync('controller-res.json', JSON.stringify(data, null, 2));
            }
        };

        await aiController.chat(req, res);
        
    } catch (err) {
        console.error("CRITICAL ERROR IN TEST:", err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
