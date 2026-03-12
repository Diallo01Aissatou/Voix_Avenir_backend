const express = require('express');
const { validate } = require('../middlewares/OportainMiddleware');
const { applicationSchema } = require('../validators/OportainValidator');
const OportainController = require('../controllers/OportainController');

const router = express.Router();

// POSTULER (public)
router.post('/', validate(applicationSchema), OportainController.createApplication);

// Liste des candidatures (admin)
router.get('/', OportainController.listApplications);

module.exports = router;
