import { summarizeIncidentReport } from './flows/summarize-incident-report.js';
import { classifyIncidentType } from './flows/classify-incident-type.js';
import { estimateIncidentSeverity } from './flows/estimate-incident-severity.js';
import { suggestEscalation } from './flows/suggest-escalation-protocol.js';
import { suggestIncidentTags } from './flows/suggest-incident-tags.js';
const { rankIncidentByRelevance } = require('./flows/rank-incident-by-relevance.js');

async function runAllTests() {
  console.log('--- Testing summarizeIncidentReport ---');
  const summary = await summarizeIncidentReport({ report: 'A fire broke out in the server room. The sprinklers activated and the fire was contained, but there is smoke damage.' });
  console.log(summary);

  console.log('--- Testing classifyIncidentType ---');
  const classification = await classifyIncidentType({ description: 'Unauthorized access detected in the main office after hours.' });
  console.log(classification);

  console.log('--- Testing estimateIncidentSeverity ---');
  const severity = await estimateIncidentSeverity({ report: 'A chemical spill occurred in the lab. No injuries, but evacuation was required.' });
  console.log(severity);

  console.log('--- Testing suggestEscalation ---');
  const escalation = await suggestEscalation({ incidentDescription: 'Suspicious package found at the entrance.', incidentType: 'Security', incidentLocation: 'Main Gate' });
  console.log(escalation);

  console.log('--- Testing suggestIncidentTags ---');
  const tags = await suggestIncidentTags({ incidentReport: 'Water leak detected in the basement. Maintenance notified.' });
  console.log(tags);

  console.log('--- Testing rankIncidentByRelevance (Vertex) ---');
  const ranking = await rankIncidentByRelevance({
    incidents: [
      'Fire in the server room',
      'Unauthorized access in main office',
      'Water leak in basement',
      'Suspicious package at entrance'
    ],
    query: 'security threat',
  });
  console.log(ranking);
}

runAllTests().catch(console.error); 