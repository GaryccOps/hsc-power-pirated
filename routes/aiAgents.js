const express = require('express');
const router = express.Router();
const aiAgent = require('../controllers/aiChat');

/**
 * @route   POST /ai-agents/chat
 * @desc    Send a message to ChatGPT and get a response
 * @access  Public (can be protected with JWT middleware if needed)
 * @body    { message: string, model?: string }
 */
router.post('/chat', aiAgent.chat);

module.exports = router;
