const Oportain = require('../models/oportain');

const createApplication = async (req, res) => {
  try {
    const { fullName, email, phone, position, cvUrl, coverLetter } = req.body;

    const app = await Oportain.create({
      fullName,
      email,
      phone,
      position,
      cvUrl,
      coverLetter
    });

    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listApplications = async (_req, res) => {
  try {
    const apps = await Oportain.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createApplication, listApplications };
