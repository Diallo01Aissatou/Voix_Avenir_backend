const mongoose = require('mongoose');
const MentorshipRequest = require('./models/MentorshipRequest');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/voix-avenir-mentors', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const requests = await MentorshipRequest.find({})
    .populate('mentore', 'name photo profession expertise bio city availableDays startTime endTime')
    .limit(2)
    .sort({ createdAt: -1 });
  
  console.log(JSON.stringify(requests, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
