require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("❌ Erreur : GROQ_API_KEY manquante dans le fichier .env");
        return;
    }

    console.log(`Test de Groq avec la clé : ${key.substring(0, 10)}...`);
    const groq = new Groq({ apiKey: key });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Tu es un assistant utile.' },
                { role: 'user', content: 'Bonjour, est-ce que tu fonctionnes ?' }
            ],
            model: "llama-3.3-70b-versatile",
        });

        console.log("✅ SUCCÈS ! Réponse de Groq :");
        console.log("-------------------");
        console.log(chatCompletion.choices[0].message.content);
        console.log("-------------------");
    } catch (e) {
        console.error("❌ ÉCHEC DU TEST GROQ :");
        console.error(e.message);
    }
}

testGroq();
