import express from 'express';
import { chat } from '../controllers/aiChat.js';

const router = express.Router();

/**
 * @route   POST /ai-agents/chat
 * @desc    Send a message to ChatGPT and get a response
 * @access  Public (can be protected with JWT middleware if needed)
 * @body    { message: string, model?: string }
 */
router.post('/chat', chat);

export default router;
