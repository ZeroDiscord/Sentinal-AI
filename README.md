cl# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## SentinelAI: AI Flows Usage & Extension

### Using the AI Flows
- All AI flows are in `src/ai/flows/` and use a central utility for Gemini (`gemini.js`) or Vertex (`vertex.js`).
- Each flow returns a robust, predictable object (see below).
- To test all flows, run:
  ```sh
  node src/ai/test-ai-flows.js
  ```

### Adding or Extending Flows
- To add a new flow, create a file in `src/ai/flows/` and use the pattern:
  - Import the central utility (`callGemini` or `callVertexGemini`).
  - Write a prompt that instructs the model to respond in strict JSON.
  - Parse the response using the provided parsing helpers.
- Example output structure for `summarizeIncidentReport`:
  ```js
  {
    summary: '...',
    tags: ['tag1', 'tag2'],
    severity: 'low' | 'medium' | 'high',
    escalate: true | false,
    geminiRaw: // full Gemini response
  }
  ```

### Switching Between Gemini and Vertex
- Use `callGemini` for Gemini API (default for most flows).
- Use `callVertexGemini` for Vertex AI (see `rank-incident-by-relevance.js` for example).
- Both utilities provide robust response parsing and error handling.

### Output Format Guarantees
- All flows return a predictable object, even if the model returns markdown, text, or malformed JSON.
- If parsing fails, a fallback value is returned and the raw model response is included for debugging.

---
For more details, see the code in `src/ai/flows/` and the test script in `src/ai/test-ai-flows.js`.
