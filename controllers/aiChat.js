import { openai } from '../clients/openaiClient.js';
import { supabase } from '../clients/supabaseClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import fs from 'fs/promises';

/**
 * Send a message to ChatGPT and get a response
 * POST /ai-agents/chat
 * Body: { message: string, model?: string }
 */
export const chat = async (req, res) => {
  const { message, model = 'gpt-4.1-nano' } = req.body;
  const instructions = await fs.readFile("instructions/instruction.md", "utf-8");
  // Validation
  if (!message) {
    return ErrorResponse.badRequest('Message is required').send(res);
  }

  try {
    // Call OpenAI API
    // const responses = await openai.responses.create({
    //   model: model,
    //   instructions,
    //   input: [
    //     {
    //       role: 'user',
    //       content: message
    //     }
    //   ],
    //   temperature: 0.7,
    //   max_tokens: 100
    // });

    //const outputText = JSON.parse(responses.output_text);
    //console.log('Output Text:', responses.outputText);

    // TODO: use mock data
    const responses = await fs.readFile("instructions/course-response.json", "utf-8");
    const jsonData = JSON.parse(responses);
    const outputText = JSON.parse(jsonData.data.output_text);

    // saveInDatabase(outputText);

    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully and saved to database',
      data: {
        output_text: outputText
        // full_response: jsonData
      }
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return ErrorResponse.fromException(error, 500).send(res);
  }
};

async function saveInDatabase(outputText) {
  // // Store the response in Supabase
  const { data: savedData, error: dbError } = await supabase
    .from('recommend_courses')
    .insert([
      {

        courses_json:outputText,
      }
    ])
    .select();

  if (dbError) {
    console.error('Database Error:', dbError);
    return ErrorResponse.internalServerError('Failed to save response to database', dbError.message).send(res);
  }
}
