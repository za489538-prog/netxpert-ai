import admin from "firebase-admin";

const MAX_HISTORY_MESSAGES = 40;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const GEMINI_MODEL = "gemini-3.6-flash";
const SYSTEM_CONTEXT = "You are NetXpert AI, a clear networking tutor. Answer in Arabic when the user writes Arabic and explain networking topics simply.";

function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  }
  return admin;
}

async function verifyUser(req) {
  const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return (await getAdmin().auth().verifyIdToken(match[1])).uid;
  } catch {
    return null;
  }
}

async function consumeRateLimit(uid) {
  const firestore = getAdmin().firestore();
  const ref = firestore.collection("rate_limits").doc(uid);
  const now = Date.now();
  return firestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const old = snapshot.exists ? snapshot.data() : null;
    const expired = !old || now - old.windowStart >= RATE_LIMIT_WINDOW_MS;
    const record = expired ? { windowStart: now, count: 0 } : old;
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) return false;
    transaction.set(ref, { windowStart: record.windowStart, count: record.count + 1 });
    return true;
  });
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return new Response(JSON.stringify({ error: "Please sign in before using the AI assistant" }), { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const chatHistory = Array.isArray(payload?.chatHistory) ? payload.chatHistory : [];
  if (chatHistory.length === 0 || chatHistory.length > MAX_HISTORY_MESSAGES) {
    return new Response(JSON.stringify({ error: "Invalid chat history" }), { status: 400 });
  }

  try {
    if (!(await consumeRateLimit(uid))) {
      return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "AI service is not configured" }), { status: 500 });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory, systemInstruction: { parts: [{ text: SYSTEM_CONTEXT }] } }),
    });
    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: data?.error?.message || "Gemini request failed" }), { status: response.status });

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I could not understand the question. Please try again.";
    return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[AI] Request failed", error);
    return new Response(JSON.stringify({ error: "The AI assistant is temporarily unavailable" }), { status: 502 });
  }
}
