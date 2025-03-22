const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/change-password', auth, changePassword);

module.exports = router; 