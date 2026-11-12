const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');

// Digital NOC chain routes
router.get('/noc', approvalController.getNocStatus);
router.post('/noc/sign', approvalController.signNoc);

// Academic credits & gradebook sync
router.get('/credits', approvalController.getCreditStatus);
router.post('/credits/log-hours', approvalController.logHours);
router.post('/credits/push-gradebook', approvalController.pushToGradebook);

module.exports = router;
