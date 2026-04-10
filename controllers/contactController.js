const Contact = require('../models/Contact');
const sendEmail = require('../utils/emailService');

/**
 * Soumission d'un formulaire de contact
 * POST /api/contact
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Sauvegarde dans la base de données
    const newContact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    // 2. Préparation des emails
    const adminEmailHtml = `
      <h2>Nouveau message de contact</h2>
      <p><strong>De:</strong> ${name} (${email})</p>
      <p><strong>Sujet:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>ID du message: ${newContact._id}</p>
    `;

    const userConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #9333ea;">Bonjour ${name} !</h1>
        <p>Merci d'avoir contacté <strong>Voix d'Avenir</strong>. Nous avons bien reçu votre message concernant : <em>${subject}</em>.</p>
        <p>Notre équipe va examiner votre demande et vous répondra dans les plus brefs délais.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin-top: 0;"><strong>Votre message :</strong></p>
          <p style="font-style: italic; color: #4b5563;">"${message}"</p>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Ceci est un email automatique, merci de ne pas y répondre directement.</p>
      </div>
    `;

    // 3. Envoi des emails (non-bloquant pour la réponse API)
    // Notification à l'admin
    sendEmail({
      to: 'contact@voixdavenir.gn',
      subject: `[Contact] ${subject.toUpperCase()} - ${name}`,
      html: adminEmailHtml,
      text: `Nouveau message de ${name} (${email}) sur le sujet ${subject}: ${message}`
    }).catch(err => console.error("Erreur notification admin:", err.message));

    // Confirmation à l'utilisateur
    sendEmail({
      to: email,
      subject: `Confirmation de réception - Voix d'Avenir`,
      html: userConfirmationHtml,
      text: `Bonjour ${name}, nous avons bien reçu votre message. Merci de nous avoir contactés.`
    }).catch(err => console.error("Erreur confirmation utilisateur:", err.message));

    res.status(201).json({
      success: true,
      data: newContact,
      message: 'Votre message a été envoyé avec succès !'
    });

  } catch (error) {
    console.error('Erreur soumission contact:', error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer."
    });
  }
};
