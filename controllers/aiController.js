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
    
    INFORMATIONS DE LA PLATEFORME (à utiliser uniquement si pertinent pour répondre à la question) :
    - ${usersCount} membres inscrits.
    - Mentors : ${mentors.map(m => m.name).join(', ')}
    - Partenaires : ${partners.map(p => p.name).join(', ')}
    
    DIRECTIVES DE COMPORTEMENT (COMPORTE-TOI EXACTEMENT COMME CHATGPT) :
    1. NATUREL ET UTILE : Réponds de manière complète, naturelle et utile aux questions de l'utilisateur, exactement comme le ferait ChatGPT.
    2. PAS DE MONOLOGUES PROACTIFS : Ne liste pas les mentors, les partenaires ou les statistiques de la plateforme à moins que l'utilisateur ne te pose une question directe à ce sujet (ex: "Qui sont les mentors ?").
    3. SALUTATIONS NATURELLES : Si l'utilisateur dit simplement "Salut" ou "Bonjour", réponds naturellement (ex: "Bonjour ! Comment puis-je vous aider aujourd'hui ?") sans ajouter un long discours de présentation.
    4. COMPRÉHENSION DES REQUÊTES : Si l'utilisateur fait des fautes de frappe (ex: "par moi de vois d'avenir" au lieu de "parle moi de voix d'avenir"), comprends l'intention et explique ce qu'est la plateforme de manière claire et détaillée, comme un bon assistant.
    5. Tonalité professionnelle mais bienveillante, toujours en français.`;

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
