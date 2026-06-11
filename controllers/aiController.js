const Groq = require('groq-sdk');
const User = require('../models/User');
const Expert = require('../models/Expert');
const Partner = require('../models/Partner');

// Initialisation de Groq avec la clé API
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

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

        let context = `Tu es l'assistant IA de la plateforme "Mentorat-GN" (Voix d'Avenir).
    
    INFORMATIONS DE LA PLATEFORME :
    - ${usersCount} membres inscrits.
    - Mentors : ${mentors.map(m => m.name).join(', ')}
    - Partenaires : ${partners.map(p => p.name).join(', ')}
    
    DIRECTIVES CRUCIALES DE COMPORTEMENT :
    1. CONCISION EXTRÊME : Tu dois répondre EXACTEMENT et UNIQUEMENT à la question posée, sans rien ajouter d'autre.
    2. SALUTATIONS SIMPLES : Si l'utilisateur dit juste "Salut" ou "Bonjour", réponds uniquement par une salutation équivalente (ex: "Bonjour !", "Salut !"), SANS ajouter de présentation, SANS demander comment tu peux aider, et SANS lister les mentors.
    3. AUCUNE INFORMATION NON SOLLICITÉE : Ne donne jamais d'informations sur la plateforme, les mentors ou les statistiques si l'utilisateur ne l'a pas explicitement demandé.
    4. STYLE CHATGPT DIRECT : Agis comme une personne normale dans une conversation directe. Ne sois pas proactif, ne pose pas de questions de relance, et ne propose pas d'aide non sollicitée.
    5. FORMATAGE : Reste naturel, clair et direct, toujours en français.`;

        return context;
    } catch (error) {
        console.error('Erreur lors de la récupération du contexte:', error);
        return 'Tu es l\'assistant IA de Mentorat-GN, une plateforme de mentorat en Guinée.';
    }
};

/**
 * Gère le chat avec l'IA via Groq
 */
exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages invalides' });
        }

        const systemContext = await getPlatformContext();

        // Conversion des messages au format Groq/OpenAI
        const groqMessages = [
            { role: 'system', content: systemContext },
            ...messages.map(m => ({
                role: m.role,
                content: m.content
            }))
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        const responseContent = chatCompletion.choices[0].message.content;

        res.json({
            message: {
                role: 'assistant',
                content: responseContent
            }
        });

    } catch (error) {
        console.error('Erreur Groq Chat Error:', error);
        // Log detailed error for debugging
        const fs = require('fs');
        const errorLog = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync('ai-error.txt', errorLog);

        res.status(500).json({
            error: 'Erreur lors de la communication avec l\'IA Groq',
            message: error.message,
            code: error.status || 500
        });
    }
};
