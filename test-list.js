require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models.map(m => m.name);
        require('fs').writeFileSync('models.txt', models.join('\n'));
    } catch (err) {
        console.error("ERROR:");
        console.error(err);
    }
}

test();
