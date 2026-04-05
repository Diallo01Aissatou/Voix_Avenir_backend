require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        const user = await User.findOne({ email: /aissatoudiallo.nene29/i });
        if (user) {
            console.log('FOUND:' + user.email);
        } else {
            console.log('NOT_FOUND');
        }
        process.exit();
    })
    .catch(err => {
        console.log('ERROR');
        process.exit();
    });
