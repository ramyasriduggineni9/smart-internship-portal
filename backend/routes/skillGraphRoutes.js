const express = require('express');
const router = express.Router();
const skillGraphController = require('../controllers/skillGraphController');

router.get('/graph', skillGraphController.getSkillGraph);
router.post('/match', skillGraphController.matchSkills);

module.exports = router;
