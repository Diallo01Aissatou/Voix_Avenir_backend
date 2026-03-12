require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function test() {
    try {
        console.log('Testing Groq connection...');
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Hello, who are you?' }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        console.log('Response:', chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
