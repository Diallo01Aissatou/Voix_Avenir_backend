require('dotenv').config();
const mongoose = require('mongoose');
const MentorshipRequest = require('./models/MentorshipRequest');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const requests = await MentorshipRequest.find({})
    .populate('mentore', 'name photo profession expertise bio city availableDays startTime endTime')
    .sort({ createdAt: -1 })
    .limit(5);
  
  const requestsWithPhotoUrl = requests.map(request => {
    const requestObj = request.toObject();
    return {
      _id: requestObj._id,
      mentoreName: requestObj.mentore?.name,
      mentorePhoto: requestObj.mentore?.photo ? requestObj.mentore.photo.substring(0, 50) + '...' : null
    };
  });
  
  console.log(JSON.stringify(requestsWithPhotoUrl, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
