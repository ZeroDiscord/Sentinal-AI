
<h1 align="center" style="font-size:2.5rem; font-weight:800; letter-spacing:-1px; margin-bottom:0.5em; font-family:'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'sans-serif';">
  <img src="public/favicon.svg" alt="SentinelAI Logo" style="height:2.2em; vertical-align:middle; margin-right:0.5em;" />
  <span>
    SentinelAI Incident Reporting
  </span>
</h1>
<div style="max-width: 900px; margin: 2em auto; background: rgba(15,23,42,0.85); border-radius: 1.5em; box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18); padding: 2.5em 2em; color: #f1f5f9; font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; border: 1px solid rgba(99,102,241,0.12);">

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #60a5fa; font-size: 2rem; font-weight: 800; margin-bottom: 0.5em; letter-spacing: -1px;">
      <span style="vertical-align: middle;">&#128161; Why</span>
    </h2>
    <p style="font-size: 1.1em; color: #94a3b8;">
      For Google Developer Groups (GDG) On-Campus organiser hiring, I had to devise a technical solution to solve an issue the community or college was struggling with. With the use of Google technologies and the proper inspiration, I was able to do that.
    </p>
  </section>

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #6366f1; font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4em;">
      <span style="vertical-align: middle;">&#128187; Overview</span>
    </h2>
    <p style="font-size: 1.1em; color: #cbd5e1;">
      <b>SentinelAI</b> is an advanced <span style="color:#60a5fa;">AI-driven</span> incident management software for schools and campuses. Using state-of-the-art AI (Google Gemini) to process, classify, and escalate incident reports, it provides real-time dashboards, role-based security, and simple user management.
    </p>
  </section>

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #22c55e; font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4em;">
      <span style="vertical-align: middle;">&#128204; Motivation</span>
    </h2>
    <p style="font-size: 1.1em; color: #94a3b8;">
      Besides being a coder and a tech enthusiast, I am also an extremely engaged member of the University's official Student Discipline Committee, DC. In my committee work, one glaring lack that I have noticed is the lack of one, intelligent platform for reporting and managing incidents in the campus.
    </p>
    <div style="background: rgba(99,102,241,0.08); border-radius: 1em; padding: 1em 1.5em; margin: 1.2em 0;">
      <p style="margin-bottom: 0.5em; color: #facc15; font-weight: 600;">Current students are tasked with physically forwarding an email to the Chief Proctor Office (CPO) for reporting emergency and disciplinary issues. The system is suboptimal and flawed:</p>
      <ul style="color: #f1f5f9; margin-left: 1.2em; list-style: disc;">
        <li>Emails are unstructured and hard to prioritize.</li>
        <li>They tend to lack well-organized, actionable information.</li>
        <li>There is no protocol or authentication.</li>
        <li>No assurance of follow-up or visibility to the concerned authority.</li>
      </ul>
    </div>
    <p style="margin-bottom: 0.5em; color: #94a3b8;">Through the <b>SentinelAI</b> platform, we are able to:</p>
    <ul style="color: #60a5fa; margin-left: 1.2em; list-style: square;">
      <li>Permit students to report incidents in text reviewing them with Gemini AI.</li>
      <li>Auto-extract such vital information like category (i.e., harassment, ragging, theft), severity, time, and location.</li>
      <li>Real-time reporting of incidents to the concerned authority by role and access (e.g., School Proctors, Wardens, Secretaries, or Chief Proctor Office).</li>
      <li>Offer a real-time dashboard to proctorial and security officials, displaying active incidents, and charts.</li>
      <li>Offer anonymous reporting with privacy and escalation capabilities.</li>
      <li>Replace unstructured email-based reporting with structured, AI-tagged reports that are traceable, searchable, and prioritizable.</li>
    </ul>
    <p style="margin-top: 1em; color: #cbd5e1;">
      With the incorporation of modern front-end design <span style="color:#6366f1;">vibecoded by Google's IDX</span> powered by Google's cloud and AI stack, combined with real-world domain know-how in university discipline processes, SentinelAI demonstrates a scalable, high-impact solution that is not a prototype and is close to production-grade maturity.
    </p>
  </section>

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #facc15; font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4em;">
      <span style="vertical-align: middle;">&#9889; Core Features</span>
    </h2>
    <ul style="margin-left: 1.2em; color: #f1f5f9; font-size: 1.08em; line-height: 1.7;">
      <li><b style="color:#60a5fa;">Role-Based Authentication:</b> Safe login and role management (e.g., CPO, school proctor, warden, student).</li>
      <li><b style="color:#60a5fa;">Incident Report:</b> Incident report information (description, where, optional media uploads).</li>
      <li><b style="color:#60a5fa;">AI Incident Analysis:</b> Summarizes and annotates incidents, classifies them, and estimates their severity using Gemini API and also provides escalation recommendations.</li>
      <li><b style="color:#60a5fa;">Incident Dashboard:</b> Real-time incident dashboard to view, filter, and manage incidents by role, school, and others.</li>
      <li><b style="color:#60a5fa;">Real-time Notifications:</b> Notifications for critical events.</li>
      <li><b style="color:#60a5fa;">User Management:</b> Management of user profiles to view and update their information.</li>
    </ul>
  </section>

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #ef4444; font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4em;">
      <span style="vertical-align: middle;">&#128187; Tech Stack</span>
    </h2>
    <ul style="margin-left: 1.2em; color: #cbd5e1; font-size: 1.08em; line-height: 1.7;">
      <li><b>Frontend:</b> Next.js (React), Tailwind CSS, Radix UI, Lucide Icons</li>
      <li><b>Backend:</b> Next.js API routes, Firebase (Firestore, Auth), Gemini API (Google GenAI)</li>
      <li><b>AI Integration:</b> Centralized in <code style="background:rgba(99,102,241,0.12); color:#60a5fa; border-radius:0.3em; padding:0.1em 0.4em;">src/ai/gemini.js</code> and flows</li>
      <li><b>Authentication:</b> Firebase Auth (Google, email/password, anonymous)</li>
      <li><b>Styling:</b> Glassmorphism, Inter/Google Sans fonts, and a custom color palette:</li>
      <ul style="margin-left: 1.5em; color: #94a3b8; font-size: 0.98em;">
        <li><span style="color:#60a5fa;"><b>Primary Blue:</b></span> <code>#60a5fa</code> (used for highlights, buttons, and icons)</li>
        <li><span style="color:#6366f1;"><b>Accent Indigo:</b></span> <code>#6366f1</code> (used for gradients and accent elements)</li>
        <li><span style="color:#0f172a;"><b>Background Slate:</b></span> <code>#0f172a</code> and <code>#1e293b</code> (main backgrounds and cards)</li>
        <li><span style="color:#fff;"><b>Glass Card Overlay:</b></span> semi-transparent white (<code>rgba(255,255,255,0.08)</code>) for glassmorphism effect</li>
        <li><span style="color:#f1f5f9;"><b>Text Foreground:</b></span> <code>#f1f5f9</code> (main text), <code>#94a3b8</code> (muted text)</li>
        <li><span style="color:#22c55e;"><b>Success/Resolved:</b></span> <code>#22c55e</code></li>
        <li><span style="color:#facc15;"><b>Warning:</b></span> <code>#facc15</code></li>
        <li><span style="color:#ef4444;"><b>Destructive/Error:</b></span> <code>#ef4444</code></li>
      </ul>
    </ul>
  </section>

  <section style="margin-bottom: 2.5em;">
    <h2 style="color: #60a5fa; font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4em;">
      <span style="vertical-align: middle;">&#128640; Getting Started</span>
    </h2>
    <div style="background: rgba(99,102,241,0.08); border-radius: 1em; padding: 1em 1.5em; margin-bottom: 1.2em;">
      <h3 style="color: #22c55e; font-size: 1.1em; font-weight: 700; margin-bottom: 0.5em;">Prerequisites</h3>
      <ul style="color: #f1f5f9; margin-left: 1.2em;">
        <li>Node.js 20+</li>
        <li>Firebase project (Firestore, Auth enabled)</li>
        <li>Gemini API key (Google GenAI)</li>
      </ul>
    </div>
    <h3 style="color: #6366f1; font-size: 1.1em; font-weight: 700; margin-bottom: 0.5em;">Installation</h3>
    <ol style="color: #cbd5e1; margin-left: 1.2em; font-size: 1.05em;">
      <li style="margin-bottom: 0.7em;">
        <b>Clone the repository:</b>
        <pre style="background: #1e293b; color: #60a5fa; border-radius: 0.5em; padding: 0.7em 1em; margin: 0.5em 0; font-size: 1em; overflow-x: auto;">git clone https://github.com/ZeroDiscord/Sentinal-AI
cd sentinelai</pre>
      </li>
      <li style="margin-bottom: 0.7em;">
        <b>Install dependencies:</b>
        <pre style="background: #1e293b; color: #60a5fa; border-radius: 0.5em; padding: 0.7em 1em; margin: 0.5em 0; font-size: 1em; overflow-x: auto;">npm install</pre>
      </li>
      <li style="margin-bottom: 0.7em;">
        <b>Set up environment variables:</b>
        <span style="color:#94a3b8;">(See <code>.env.example</code> for required keys)</span>
      </li>
      <li style="margin-bottom: 0.7em;">
        <b>Configure Firebase:</b>
        <ul style="margin-left: 1.2em;">
          <li>Create a Firebase project at <a href="https://console.firebase.google.com/" style="color:#60a5fa;">console.firebase.google.com</a>.</li>
          <li>Enable <b>Firestore</b> and <b>Authentication</b> (Google, email/password, and anonymous sign-in).</li>
          <li>In the Firebase console, add a web app and copy the config into your <code>.env.local</code> file.</li>
        </ul>
      </li>
      <li style="margin-bottom: 0.7em;">
        <b>Run the development server:</b>
        <pre style="background: #1e293b; color: #60a5fa; border-radius: 0.5em; padding: 0.7em 1em; margin: 0.5em 0; font-size: 1em; overflow-x: auto;">npm run dev</pre>
        <span style="color:#94a3b8;">The app will be available at <a href="http://localhost:3000" style="color:#60a5fa;">http://localhost:3000</a>.</span>
      </li>
      <li>
        <b>(Optional) Deploy:</b>
        <ul style="margin-left: 1.2em;">
          <li>You can deploy to your preferred platform.</li>
          <li>Make sure to set the same environment variables in your deployment settings.</li>
        </ul>
      </li>
    </ol>
  </section>

  <hr style="border: none; border-top: 1.5px solid #6366f1; margin: 2.5em 0 1.5em 0;">

  <div style="text-align: center; color: #94a3b8; font-size: 1.08em;">
    <b>For more details, see <a href="src/ai/gemini.js" style="color:#60a5fa; text-decoration: underline;">src/ai/gemini.js</a> for AI integration setup.</b>
  </div>
</div>
