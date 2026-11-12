const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

module.exports = router;
