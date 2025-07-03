import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-incident-report.js';
import '@/ai/flows/suggest-escalation-protocol.js';
import '@/ai/flows/suggest-incident-tags.js';
import '@/ai/flows/estimate-incident-severity.js';
import '@/ai/flows/classify-incident-type.js';