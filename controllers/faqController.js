const FAQ = require('../models/FAQ');

// Obtenir toutes les FAQs
exports.getFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ category: 1, createdAt: -1 });

        // Grouper les FAQs par catégorie pour le frontend
        const groupedFAQs = faqs.reduce((acc, faq) => {
            const { category } = faq;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                id: faq._id,
                question: faq.question,
                answer: faq.answer
            });
            return acc;
        }, {});

        res.json(groupedFAQs);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des FAQs', error: error.message });
    }
};

// Ajouter une FAQ (pour un usage futur par l'admin)
exports.createFAQ = async (req, res) => {
    try {
        const { category, question, answer } = req.body;
        const faq = new FAQ({ category, question, answer });
        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la création de la FAQ', error: error.message });
    }
};
