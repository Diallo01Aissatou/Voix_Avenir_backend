const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Partner = require('../models/Partner');

// Initialisation de Gemini avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Le modèle sera initialisé dynamiquement avec le contexte système dans exports.chat

/**
 * Récupère le contexte de la plateforme pour l'IA
 */
const getPlatformContext = async () => {
    try {
        const [mentors, experts, partners, usersCount] = await Promise.all([
            User.find({ role: 'mentore' }).select('name profession expertise city').limit(10),
            Expert.find().select('name specialty description').limit(10),
            Partner.find().select('name description'),
            User.countDocuments()
        ]);

        let context = `Tu es l'assistant de conversation intelligent et bienveillant de la plateforme "Mentorat-GN" (aussi appelée "Voix d'Avenir"). 
    Ta mission est d'agir comme un coach et un guide pour les jeunes filles et les mentors en Guinée.
    
    INFORMATIONS RÉELLES DE LA PLATEFORME (Utilise-les pour personnaliser tes réponses) :
    - Communauté : Nous avons déjà ${usersCount} membres inscrits.
    - Mentors disponibles : ${mentors.map(m => `${m.name} (${m.profession || 'Experte'}, spécialisée en ${m.expertise?.join(', ') || 'divers domaines'})`).join('; ')}
    - Expertes à la une : ${experts.map(e => `${e.name} (${e.specialty})`).join('; ')}
    - Nos partenaires de confiance : ${partners.map(p => p.name).join(', ')}
    
    DIRECTIVES DE PERSONNALITÉ (Style ChatGPT) :
    1. JOYEUSE & ENCOURAGEANTE : Utilise un ton chaleureux, utilise quelques emojis (pas trop) et encourage toujours l'utilisatrice.
    2. INTERACTIVE : Ne donne pas juste des faits. Pose des questions pour mieux comprendre les besoins (ex: "Quel domaine t'intéresse le plus parmi ceux de nos mentors ?").
    3. EXPERTE LOCALE : Tu connais le contexte guinéen. Parle d'avenir, de leadership féminin et d'autonomisation.
    4. FORMATAGE : Utilise le Markdown pour rendre tes réponses lisibles (gras, listes à puces, titres subtils).
    
    RÈGLES CRUCIALES :
    - Si on te demande qui tu es, présente-toi comme l'IA de Mentorat-GN.
    - Oriente les utilisatrices vers l'inscription (/register) ou la liste des mentors (/experts) si c'est pertinent.
    - Sois proactif : si une utilisatrice parle de ses doutes, propose-lui de contacter une de nos mentors citées plus haut.
    
    Réponds maintenant à l'utilisatrice de manière fluide et naturelle. Toujours en français.`;

        return context;
    } catch (error) {
        console.error('Erreur lors de la récupération du contexte:', error);
        return 'Tu es l\'assistant IA de Mentorat-GN, une plateforme de mentorat en Guinée.';
    }
};

/**
 * Gère le chat avec l'IA via Gemini
 */
exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages invalides' });
        }

        const systemContext = await getPlatformContext();

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash", 
            systemInstruction: systemContext
        });


        // Séparer le dernier message (la question actuelle)
        const userMessage = messages[messages.length - 1].content;

        let history = [];
        const previousMessages = messages.slice(0, -1);
        
        previousMessages.forEach(m => {
            const role = m.role === 'assistant' ? 'model' : 'user';
            
            if (history.length === 0) {
                // Gemini exige que l'historique commence logiquement. Si on a un message 'model' en premier, 
                // on ajoute d'abord un faux message 'user' pour équilibrer l'alternance.
                if (role === 'model') {
                    history.push({ role: 'user', parts: [{ text: "Bonjour" }] });
                }
            }
            
            const lastRole = history.length > 0 ? history[history.length - 1].role : null;
            if (role !== lastRole) {
                history.push({ role, parts: [{ text: m.content }] });
            }
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const textArea = response.text();

        res.json({
            message: {
                role: 'assistant',
                content: textArea
            }
        });

    } catch (error) {
        console.error('Erreur Gemini Chat Error:', error);
        // Log detailed error for debugging
        const fs = require('fs');
        const errorLog = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync('ai-error.txt', errorLog);

        res.status(500).json({
            error: 'Erreur lors de la communication avec l\'IA Gemini',
            message: error.message,
            code: error.status || 500
        });
    }
};

