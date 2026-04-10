/**
 * Envoie un email via l'API Brevo (Sendinblue)
 */
const sendEmail = async (options) => {
  if (!process.env.BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY manquant dans le fichier .env");
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: process.env.EMAIL_SENDER_NAME || "Voix d'Avenir", 
          email: process.env.EMAIL_SENDER_EMAIL || "voixavenir224@gmail.com" 
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur API Brevo');
    
    console.log('✅ Email envoyé via Brevo API:', data.messageId);
    return data;
  } catch (err) {
    console.error('❌ Erreur Brevo API:', err.message);
    throw err;
  }
};

module.exports = sendEmail;

