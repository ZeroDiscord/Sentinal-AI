import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Calls Gemini with a given prompt and model.
 * @param {Object} options
 * @param {string} options.prompt - The prompt to send to Gemini.
 * @param {string} [options.model=''] - The Gemini model to use.
 * @returns {Promise<object>} - The Gemini API response.
 */
export async function callGemini({ prompt, model = 'gemini-1.5-flash' }) {
  return ai.models.generateContent({ model, contents: prompt });
} 