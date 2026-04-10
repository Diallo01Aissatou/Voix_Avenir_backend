require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        console.log('API Key present:', !!process.env.GEMINI_API_KEY);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const systemContext = "Tu es l'assistant de conversation de Mentorat-GN.";

        // Use systemInstruction for gemini-1.5-flash
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemContext
        });



        const frontendMessages = [
            { role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider ?' },
            { role: 'user', content: 'Je cherche une mentor.' },
            { role: 'assistant', content: 'C\'est super. Quel domaine ?' },
            { role: 'user', content: 'Le leadership.' } // This is the new message to send
        ];

        // The user message to send
        const userMessage = frontendMessages[frontendMessages.length - 1].content;

        // Build history from previous messages (alternating correctly)
        // We only take messages BEFORE the last one
        let history = [];
        const previousMessages = frontendMessages.slice(0, -1);
        
        // Gemini strictly wants alternating user/model. If the first is model, it might fail? 
        // Let's filter to ensure it's strictly alternating.
        previousMessages.forEach(m => {
            const role = m.role === 'assistant' ? 'model' : 'user';
            
            if (history.length === 0) {
                // If the first message in history is from 'model', Gemini might reject it because history should start with 'user'.
                // If so, we just inject a dummy user message or drop the model message.
                if (role === 'model') {
                    history.push({ role: 'user', parts: [{ text: "Bonjour" }] });
                }
            }
            
            const lastRole = history.length > 0 ? history[history.length - 1].role : null;
            if (role !== lastRole) {
                history.push({ role, parts: [{ text: m.content }] });
            }
        });

        console.log("HISTORY:", JSON.stringify(history, null, 2));

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            },
        });

        console.log('Sending message:', userMessage);
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        console.log("RESPONSE:", response.text());

    } catch (err) {
        require('fs').writeFileSync('ai-error.txt', err.stack || err.message);
    }
}
test();
