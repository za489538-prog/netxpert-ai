const admin = require("firebase-admin");

const MAX_HISTORY_MESSAGES = 40;
const MAX_TEXT_PART_LENGTH = 8000;
const MAX_BODY_BYTES = 1024 * 1024;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const GEMINI_MODEL = "gemini-3.6-flash";
const SYSTEM_CONTEXT =
  "You are NetXpert AI, a clear networking tutor. Answer in Arabic when the user writes Arabic and explain networking topics simply.";

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function getHeader(event, name) {
  const headers = event?.headers || {};
  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === wanted);
  return key ? headers[key] : "";
}

function parseServiceAccount(raw) {
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
  const account = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is incomplete");
  }
  return {
    ...account,
    private_key: account.private_key.replace(/\\n/g, "\n"),
  };
}

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  }
  return admin;
}

async function verifyUser(event) {
  const match = getHeader(event, "authorization").match(/^Bearer\s+(.+)$/i);
  if (!match) return { uid: null, setupError: false };

  let firebaseAdmin;
  try {
    firebaseAdmin = getAdmin();
  } catch (error) {
    console.error("[AI] Firebase Admin setup failed", error?.message || "unknown error");
    return { uid: null, setupError: true };
  }

  try {
    return { uid: (await firebaseAdmin.auth().verifyIdToken(match[1])).uid, setupError: false };
  } catch (error) {
    console.error("[AI] Firebase ID token verification failed", error?.code || "unknown", error?.message || "unknown error");
    return { uid: null, setupError: false };
  }
}

async function consumeRateLimit(uid) {
  const firestore = getAdmin().firestore();
  const ref = firestore.collection("rate_limits").doc(uid);
  const now = Date.now();

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const old = snapshot.exists ? snapshot.data() : null;
    const expired = !old || now - Number(old.windowStart) >= RATE_LIMIT_WINDOW_MS;
    const record = expired ? { windowStart: now, count: 0 } : old;

    if (!Number.isInteger(record.count) || record.count < 0) {
      throw new Error("Invalid rate-limit record");
    }
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) return false;

    transaction.set(ref, {
      windowStart: record.windowStart,
      count: record.count + 1,
      updatedAt: now,
    });
    return true;
  });
}

function parsePayload(event) {
  if (!event.body) throw new Error("Invalid JSON body");
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    const error = new Error("Request body is too large");
    error.statusCode = 413;
    throw error;
  }
  return typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
}

function validateChatHistory(payload) {
  const chatHistory = payload?.chatHistory;
  if (!Array.isArray(chatHistory) || chatHistory.length === 0 || chatHistory.length > MAX_HISTORY_MESSAGES) {
    return { valid: false, message: "Invalid chat history" };
  }

  for (const message of chatHistory) {
    if (!message || !["user", "model"].includes(message.role) || !Array.isArray(message.parts) || message.parts.length === 0) {
      return { valid: false, message: "Invalid chat history" };
    }
    for (const part of message.parts) {
      if (!part || typeof part.text !== "string" || part.text.trim().length === 0 || part.text.length > MAX_TEXT_PART_LENGTH) {
        return { valid: false, message: "Invalid chat history" };
      }
    }
  }

  return { valid: true, chatHistory };
}

async function callGemini(chatHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured");

  const apiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
        systemInstruction: { parts: [{ text: SYSTEM_CONTEXT }] },
      }),
    },
  );

  const data = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    const error = new Error(data?.error?.message || "Gemini request failed");
    error.statusCode = apiResponse.status;
    throw error;
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I could not understand the question. Please try again.";
}

async function handler(event) {
  if (event?.httpMethod !== "POST") return response(405, { error: "Method not allowed" });

  const authResult = await verifyUser(event);
  if (authResult.setupError) {
    return response(503, { error: "Authentication service is temporarily unavailable" });
  }
  if (!authResult.uid) return response(401, { error: "Please sign in before using the AI assistant" });
  const uid = authResult.uid;

  let payload;
  try {
    payload = parsePayload(event);
  } catch (error) {
    if (error.statusCode === 413) return response(413, { error: error.message });
    return response(400, { error: "Invalid JSON body" });
  }

  const validation = validateChatHistory(payload);
  if (!validation.valid) return response(400, { error: validation.message });

  try {
    if (!(await consumeRateLimit(uid))) {
      return response(429, { error: "AI usage limit reached. Please try again later." });
    }

    const reply = await callGemini(validation.chatHistory);
    return response(200, { reply });
  } catch (error) {
    console.error("[AI] Request failed", error);
    if (error.statusCode) return response(error.statusCode, { error: error.message });
    if (error.message === "AI service is not configured") {
      return response(500, { error: error.message });
    }
    return response(502, { error: "The AI assistant is temporarily unavailable" });
  }
}

module.exports = { handler, _test: { validateChatHistory, parseServiceAccount } };
