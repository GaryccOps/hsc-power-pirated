import express from 'express';
import { login } from '../controllers/login.js';
import { signup } from '../controllers/signup.js';

const router = express.Router();

//POST /auth/signup - Handle signup form submission
router.post('/signup', signup);

// POST /auth/login
router.post('/login', login);

export default router;