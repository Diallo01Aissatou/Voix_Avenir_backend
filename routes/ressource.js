const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const resourceController = require('../controllers/resourceController');
const{createResourceValidator,updateResourceValidator}=require('../validators/resourceValidator')
router.get('/',updateResourceValidator, resourceController.getResources);
router.post('/', protect,createResourceValidator, authorize('mentore','admin'), upload.single('file'), resourceController.createResource);

module.exports = router;
