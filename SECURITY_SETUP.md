# NetXpert AI — Security Setup on Netlify

## What is protected

The public browser code does not contain a Gemini API key or Firebase Admin private key. The browser sends the Firebase ID Token to `/api/gemini-chat`, and the Netlify Function verifies the token before calling the Gemini API.

The function stores a per-user request counter in Firestore using a transaction. The current limit is **20 AI requests per user per 10 minutes**. The counter is stored under `rate_limits/{uid}` and is accessed by the Firebase Admin SDK on the server only.

## Required Netlify environment variables

Add these variables in the Netlify site settings under **Project configuration → Environment variables**:

```text
GEMINI_API_KEY
FIREBASE_SERVICE_ACCOUNT
```

`GEMINI_API_KEY` is the Gemini server key. `FIREBASE_SERVICE_ACCOUNT` must contain the complete Firebase Service Account JSON downloaded from Firebase Console. Neither value may be placed in browser JavaScript, GitHub, Firestore Rules, screenshots, or chat messages.

The `FIREBASE_SERVICE_ACCOUNT` JSON is parsed by the Netlify Function and escaped private-key newlines are normalized before Firebase Admin initialization.

## Firebase Console steps

1. Open Firebase Console and select the NetXpert Firebase project.
2. Open **Project settings**.
3. Select **Service accounts**.
4. Click **Generate new private key**.
5. Keep the downloaded JSON file private.
6. Copy the complete JSON content into the Netlify environment variable named `FIREBASE_SERVICE_ACCOUNT`.
7. Add the Gemini key to `GEMINI_API_KEY` in Netlify only.

## Firestore Rules

Deploy the repository `firestore.rules` from the Firebase project so that each signed-in user can read and write only their own history:

```text
users/{uid}/history/{historyId}
```

All other document paths are denied by default. The server-side `rate_limits` collection is written by Firebase Admin and is not opened to the browser by these rules.

## Netlify routing

`netlify.toml` publishes the static project and maps `/api/*` to `/.netlify/functions/:splat`. The active AI endpoint is:

```text
/api/gemini-chat
```

The Function rejects non-POST methods, unauthenticated requests, invalid JSON, bodies over 1 MB, malformed chat history, invalid roles, empty text parts, and text parts over 8,000 characters.

## Verification checklist

- Sign out and try the AI assistant: the request must be rejected with an authentication message.
- Sign in and try the AI assistant: the request must reach the Netlify Function and return an answer.
- Send more than 20 accepted requests within ten minutes for one Firebase account: the Function must return HTTP 429.
- Check the browser Network panel: no Gemini API key or Service Account JSON may appear.
- Run the project tests:

```bash
npm ci
npm test -- --runInBand
```

The suite includes Firebase Admin mocking, authentication rejection, JSON validation, body-size validation, chat-history validation, private-key normalization, rate limiting transaction flow, and Gemini response handling.

## Important note

Netlify cannot automatically provide Manus Forge access. This deployment intentionally uses the Gemini API through the server-only `GEMINI_API_KEY` environment variable. The documentation and presentation must describe this Netlify architecture consistently.
