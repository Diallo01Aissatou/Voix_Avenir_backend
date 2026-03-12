const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['general', 'mentorat', 'compte', 'securite']
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FAQ', FAQSchema);
