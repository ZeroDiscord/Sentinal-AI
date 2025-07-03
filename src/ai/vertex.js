const { VertexAI } = require('@google-cloud/vertexai');

// These should be set in your environment or config
const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Singleton VertexAI client
const vertexAI = new VertexAI({ project, location });

/**
 * Calls a Vertex Gemini model with a given prompt and model name.
 * @param {Object} options
 * @param {string} options.prompt - The prompt to send to the model.
 * @param {string} [options.model='gemini-1.0-pro'] - The Vertex Gemini model to use.
 * @param {object} [options.generationConfig] - Optional generation config.
 * @returns {Promise<object>} - The Vertex AI response.
 */
async function callVertexGemini({ prompt, model = 'gemini-1.0-pro', generationConfig = {} }) {
  const generativeModel = vertexAI.getGenerativeModel({ model });
  const result = await generativeModel.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig });
  return result;
}

/**
 * Parses the first candidate's content as JSON or text, with fallback handling.
 * @param {object} response - The Vertex AI response object.
 * @returns {object|string} - Parsed JSON or text.
 */
function parseVertexCandidate(response) {
  try {
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
      if (match) {
        parsed = JSON.parse(match[1] || match[2]);
      }
    }
    return parsed || text;
  } catch (err) {
    return 'Vertex response parsing error';
  }
}

module.exports = { vertexAI, callVertexGemini, parseVertexCandidate }; 