const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const signupController = require('../controllers/signupController');

// POST /auth/signup - Handle signup form submission
router.post('/signup', signupController.signup);

// POST /auth/login
router.post('/login', loginController.login);

module.exports = router;