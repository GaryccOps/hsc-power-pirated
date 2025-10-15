const express = require('express');
const router = express.Router();
const loginController = require('../controllers/login');
const signupController = require('../controllers/signup');

// POST /auth/signup - Handle signup form submission
// router.post('/signup', signupController.signup);

// POST /auth/login
router.post('/login', loginController.login);

module.exports = router;