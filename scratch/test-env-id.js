require('dotenv').config();
console.log('GOOGLE_CLIENT_ID:', JSON.stringify(process.env.GOOGLE_CLIENT_ID));
console.log('Last char code:', process.env.GOOGLE_CLIENT_ID.charCodeAt(process.env.GOOGLE_CLIENT_ID.length - 1));
