const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.get('/', applicationController.getApplications);
router.post('/', applicationController.applyToJob);
router.patch('/:id/stage', applicationController.updateStage);

module.exports = router;

