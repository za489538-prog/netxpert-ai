# NetXpert AI — Netlify Deployment

## Architecture

The public site is a static frontend deployed by Netlify. The AI endpoint is the Netlify Function at `netlify/functions/gemini-chat.js`, exposed through `/api/gemini-chat` by `netlify.toml`.

The Function verifies the Firebase ID Token, applies the Firestore transaction rate limit, validates the chat history, and calls Google Gemini with the server-only `GEMINI_API_KEY`.

## Netlify site settings

Connect the GitHub repository `za489538-prog/netxpert-ai` to Netlify with these build settings:

- Build command: leave empty for the static site.
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Node version: `20` (already set in `netlify.toml`).

Add these environment variables in Netlify. Do not commit their values:

```text
GEMINI_API_KEY=<Gemini server key>
FIREBASE_SERVICE_ACCOUNT=<complete Firebase Service Account JSON>
```

Enable the variables for the production deploy context and redeploy after saving them.

## Firebase requirements

- Enable Email/Password authentication.
- Deploy the repository `firestore.rules`.
- Add the Netlify production domain to Firebase Authentication authorized domains.
- Review the Google Cloud API restrictions on the visible Firebase Web API key. It must not be allowed to access the Generative Language API.

## Verification after deploy

1. Open the Netlify production URL in an incognito browser.
2. Confirm the homepage, calculators, Dijkstra editor, anomaly analysis, dashboard, themes, and PDF export load.
3. Try the AI assistant while signed out; it must reject the request.
4. Sign in and ask a short networking question; it must return a response.
5. Inspect the Network panel; no Gemini key or Firebase Service Account JSON may appear.
6. Confirm the endpoint rejects malformed input and enforces the 20-request / 10-minute limit.

The repository test command is:

```bash
npm ci
npm test -- --runInBand
```

The current suite passes 11 suites and 118 tests.

## Important migration note

The Netlify deployment intentionally uses Google Gemini through `GEMINI_API_KEY`. It no longer relies on Manus Forge. Documentation and the defense explanation must use this architecture consistently.
