import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-incident-report.ts';
import '@/ai/flows/suggest-escalation-protocol.ts';
import '@/ai/flows/suggest-incident-tags.ts';
import '@/ai/flows/estimate-incident-severity.ts';
import '@/ai/flows/classify-incident-type.ts';