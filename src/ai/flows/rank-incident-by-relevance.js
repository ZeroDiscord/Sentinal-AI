const { callVertexGemini, parseVertexCandidate } = require('../vertex');

'use server';

/**
 * Ranks a list of incident descriptions by relevance to a query using Vertex AI.
 * @param {string[]} incidents - Array of incident descriptions.
 * @param {string} query - The query to rank by.
 * @returns {Promise<object>} - Ranked incident indices and raw Vertex response.
 */
async function rankIncidentByRelevance({ incidents, query }) {
  const prompt = `Given the following list of incident descriptions, rank them by relevance to the query. Respond in JSON as an array of indices (0-based) in descending order of relevance.\n\nQuery: ${query}\nIncidents:\n${incidents.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}`;
  const response = await callVertexGemini({ prompt });
  let rankedIndices = [];
  try {
    const parsed = parseVertexCandidate(response);
    if (Array.isArray(parsed)) {
      rankedIndices = parsed;
    } else if (typeof parsed === 'string') {
      // Try to extract array from text
      const match = parsed.match(/\[(.*?)\]/);
      if (match) {
        rankedIndices = JSON.parse(match[0]);
      }
    }
  } catch (err) {
    rankedIndices = [];
  }
  return {
    rankedIndices,
    vertexRaw: response,
  };
}

module.exports = { rankIncidentByRelevance }; 