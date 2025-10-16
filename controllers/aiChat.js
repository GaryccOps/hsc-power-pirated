const { openai } = require('../clients/openaiClient');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Send a message to ChatGPT and get a response
 * POST /ai-agents/chat
 * Body: { message: string, model?: string }
 */
exports.chat = async (req, res) => {
  const { message, model = 'gpt-4.1-nano' } = req.body;

  // Validation
  if (!message) {
    return ErrorResponse.badRequest('Message is required').send(res);
  }

  try {
    // Call OpenAI API
    const responses = await openai.responses.create({
      model: model,
      input: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      data: responses
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return ErrorResponse.fromException(error, 500).send(res);
  }
};
