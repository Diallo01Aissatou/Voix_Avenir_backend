const mongoose = require('mongoose');
require('dotenv').config();
const FAQ = require('./models/FAQ');

const faqData = [
    {
        category: 'general',
        question: "Qu'est-ce que Mentora GN ?",
        answer: "Mentora GN est une plateforme digitale de mentorat qui connecte des jeunes filles guinéennes (13-25 ans) à des femmes expertes et professionnelles. Notre objectif est de favoriser le partage d'expérience, briser les barrières géographiques et encourager l'autonomisation des filles en Guinée."
    },
    {
        category: 'general',
        question: "Comment fonctionne la plateforme ?",
        answer: "Les mentorées créent un profil et recherchent des mentores selon leurs domaines d'intérêt. Elles peuvent ensuite envoyer des demandes de mentorat. Les mentores examinent ces demandes et peuvent les accepter ou les refuser. Une fois acceptées, les deux parties peuvent communiquer via notre messagerie intégrée et programmer des séances."
    },
    {
        category: 'general',
        question: "Est-ce que le service est gratuit ?",
        answer: "Oui, Mentora GN est entièrement gratuit pour les mentorées et les mentores. Notre mission est de rendre l'accompagnement accessible à toutes les jeunes filles guinéennes, sans barrière financière."
    },
    {
        category: 'general',
        question: "Quelles villes sont couvertes ?",
        answer: "Nous couvrons actuellement 12 villes en Guinée, incluant Conakry, Kankan, Labé, N'Zérékoré, Kindia, Mamou, Boké, Faranah, Siguiri, Dabola, Guéckédou et Kissidougou."
    },
    {
        category: 'mentorat',
        question: "Comment choisir une mentore ?",
        answer: "Utilisez nos filtres de recherche pour trouver des mentores par ville, domaine d'expertise, ou profession. Lisez attentivement leurs profils et choisissez quelqu'un dont le parcours vous inspire."
    },
    {
        category: 'mentorat',
        question: "Combien de temps dure un mentorat ?",
        answer: "La durée d'un mentorat varie selon les besoins de la mentorée et la disponibilité de la mentore. Cela peut aller de quelques séances ponctuelles à un accompagnement de plusieurs mois."
    },
    {
        category: 'compte',
        question: "Comment créer mon profil ?",
        answer: "Cliquez sur \"S'inscrire\" et choisissez votre rôle. Remplissez les informations demandées : nom, email, ville, centres d'intérêt ou domaines d'expertise."
    },
    {
        category: 'securite',
        question: "Mes données sont-elles sécurisées ?",
        answer: "Oui, nous prenons la sécurité de vos données très au sérieux. Toutes les informations sont chiffrées et stockées de manière sécurisée."
    }
];

const seedFAQs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mentora-gn');
        console.log('Connecté à MongoDB pour le seeding FAQ');

        await FAQ.deleteMany({});
        console.log('Anciennes FAQs supprimées');

        await FAQ.insertMany(faqData);
        console.log('Nouvelles FAQs insérées avec succès');

        process.exit(0);
    } catch (err) {
        console.error('Erreur seeding FAQ:', err);
        process.exit(1);
    }
};

seedFAQs();
