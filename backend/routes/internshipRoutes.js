const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');

router.get('/', internshipController.getAllInternships);
router.post('/', internshipController.createInternship);

module.exports = router;
