const UserQuestion = require('../models/UserQuestion');

exports.submitQuestion = async (req, res) => {
    try {
        const { question, category, userName, userEmail } = req.body;

        const newQuestion = new UserQuestion({
            user: req.user ? req.user.id : null,
            userName: userName || (req.user ? req.user.name : 'Anonyme'),
            userEmail: userEmail || (req.user ? req.user.email : ''),
            category: category || 'autre',
            question
        });

        await newQuestion.save();
        res.status(201).json({ message: 'Question soumise avec succès !', question: newQuestion });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la soumission de la question', error: error.message });
    }
};

exports.getQuestions = async (req, res) => {
    try {
        const questions = await UserQuestion.find().sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des questions', error: error.message });
    }
};
