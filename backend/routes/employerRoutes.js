const express = require('express');
const router = express.Router();
const employerController = require('../controllers/employerController');

router.get('/', employerController.getEmployers);
router.post('/verify', employerController.verifyEmployer);

module.exports = router;
