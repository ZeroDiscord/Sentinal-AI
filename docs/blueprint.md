# **App Name**: SentinelAI

## Core Features:

- Role-Based Authentication: User authentication and role management with support for roles like 'cpo', 'school_proctor', 'warden', etc.
- Incident Reporting: Incident reporting form for users to submit incident details including description, location, and optional media uploads.
- AI-Powered Incident Analysis: AI-powered text analysis to summarize incident reports and classify the incident type using Gemini API. The tool will extract key information and suggest appropriate tags, estimate severity, and suggest escalation when appropriate. The tool will extract key information and suggest appropriate tags, estimate severity, and suggest escalation when appropriate.
- Incident Dashboard: Real-time dashboard displaying incidents with filtering based on role, school, and other criteria. Sort, filter, and manage incidents efficiently.
- Real-time Notifications: Display notifications to alert specific users about critical incidents.
- User Management: User profile management to view and update user information.

## Style Guidelines:

- Primary Background: Deep Navy Glass (#0B0F19). Usage: App background, modals, sidebars. Gives a dark, futuristic baseline for glassmorphism
- Glass Surface: Translucent Ice Gray (rgba(255, 255, 255, 0.06)) with blur: backdrop-filter: blur(12px);. Usage: Cards, incident tiles, info overlays
- Accent: Google Blue (#4285F4). Usage: Primary buttons, links, key highlights. Symbolizes AI, trust, and ties into Google's ecosystem
- Alert: Deep Amber (#F4B400). Usage: Incident priority badges (medium risk), tooltips
- Critical: Safety Red (#EA4335). Usage: Critical alerts (harassment, ragging), incident markers
- Success: Emerald Green (#34A853). Usage: Success badges, verified actions, incident resolved
- Neutral Text: Fog Gray (#CED3DC). Usage: Subtle labels, card text, status notes
- Border/Highlight: Glass Blue (#5F7FFF with low alpha for hover states)
- Font: Inter or Google Sans (clean, modern, readable). Weights: 400 (body), 600 (titles), 700 (emphasis)
- Glassmorphic Effect Snippet (CSS): .glass-card { background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 1rem; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2); }