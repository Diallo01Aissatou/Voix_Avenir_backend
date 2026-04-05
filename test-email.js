require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERS,
        pass: process.env.EMAIL_PASSS
    }
});

console.log('Testing email with:');
console.log('Email:', process.env.EMAIL_USERS);
console.log('Password length:', process.env.EMAIL_PASSS ? process.env.EMAIL_PASSS.length : 0);

const mailOptions = {
    from: process.env.EMAIL_USERS,
    to: process.env.EMAIL_USERS, // Send to self
    subject: 'Test Email - Mentorat GN',
    text: 'Ceci est un test pour vérifier la configuration SMTP.'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Erreur d\'envoi:', error);
    } else {
        console.log('Succès! Email envoyé:', info.response);
    }
});
