const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: String,
    userEmail: String,
    category: {
        type: String,
        enum: ['general', 'mentorat', 'compte', 'securite', 'autre'],
        default: 'autre'
    },
    question: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'answered', 'ignored'],
        default: 'pending'
    },
    answer: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('UserQuestion', QuestionSchema);
