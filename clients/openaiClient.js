const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Singleton OpenAI client instance
let openaiInstance = null;

/**
 * Get or create the singleton OpenAI client instance
 * @returns {Object} OpenAI client instance
 */
const getOpenAIClient = () => {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key. Please set OPENAI_API_KEY in your environment variables.');
    }
    
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL
    });
  }
  
  return openaiInstance;
};

module.exports = {
  getOpenAIClient,
  openai: getOpenAIClient() // Export the instance directly for convenience
};
