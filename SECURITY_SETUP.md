# NetXpert AI — Security Setup on Manus

## What is protected

The public browser code does not contain a Gemini API key. The browser sends the Firebase ID Token to `/api/gemini-chat`, and the Manus server verifies the token before calling the built-in AI service.

The server also stores a per-user request counter in Firestore using a transaction. The current limit is **20 AI requests per user per 10 minutes**. The counter is stored under `rate_limits/{uid}` and is accessed by the server only.

## Required Manus secret

The WebDev project requires one server-side secret:

```text
FIREBASE_SERVICE_ACCOUNT
```

Its value must be the complete Firebase Service Account JSON downloaded from Firebase Console. It must never be placed in browser JavaScript, GitHub, Firestore Rules, screenshots, or chat messages.

The current Manus implementation reads this value only from `server/_core/env.ts` and uses it in `server/firebase-security.ts` for Firebase ID Token verification and Firestore transactions.

The Manus built-in AI integration supplies the server-side model access. Do not add a Gemini key to `client/public/netxpert`.

## Firebase Console steps

1. Open Firebase Console and select the NetXpert Firebase project.
2. Open **Project settings**.
3. Select **Service accounts**.
4. Click **Generate new private key**.
5. Keep the downloaded JSON file private.
6. Add the complete JSON content as the `FIREBASE_SERVICE_ACCOUNT` secret in the Manus WebDev project.

## Firestore Rules

The repository contains `firestore.rules`. Deploy these rules from the Firebase project so that each signed-in user can read and write only their own history:

```text
users/{uid}/history/{historyId}
```

All other Firestore paths are denied by default. The server-side `rate_limits` collection is written by Firebase Admin and is not opened to the browser by these rules.

## Verification checklist

- Sign out and try the AI assistant: the request must be rejected with an authentication message.
- Sign in and try the AI assistant: the request must reach the server and return an answer.
- Send more than 20 accepted requests within ten minutes for one Firebase account: the server must return HTTP 429.
- Check the browser Network panel: no Gemini API key or Service Account JSON may appear.
- Run the project tests:

```bash
pnpm test
pnpm check
pnpm build
```

The test suite includes Firebase Admin connectivity validation and six deterministic rate-limit scenarios.

## Legacy files

The old `netlify/functions/gemini-chat.js` and `netlify.toml` files may remain in the historical static project for compatibility, but they are not used by the current Manus WebDev server. The active endpoint is implemented in `server/_core/index.ts`.
