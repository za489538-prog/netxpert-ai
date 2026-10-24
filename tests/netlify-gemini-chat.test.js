const mockAdmin = {
  apps: [],
  credential: { cert: jest.fn((account) => account) },
  initializeApp: jest.fn(() => {
    mockAdmin.apps.push({});
  }),
  auth: jest.fn(() => ({ verifyIdToken: jest.fn(async () => ({ uid: "user-1" })) })),
  firestore: jest.fn(),
};

jest.mock("firebase-admin", () => mockAdmin);

const { handler, _test } = require("../netlify/functions/gemini-chat");

const account = JSON.stringify({
  project_id: "test-project",
  client_email: "firebase@test-project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n",
});

function validEvent(overrides = {}) {
  return {
    httpMethod: "POST",
    headers: { authorization: "Bearer valid-token" },
    body: JSON.stringify({ chatHistory: [{ role: "user", parts: [{ text: "What is CIDR?" }] }] }),
    ...overrides,
  };
}

describe("Netlify Gemini function validation", () => {
  test("rejects non-POST methods", async () => {
    const result = await handler({ httpMethod: "GET", headers: {} });
    expect(result.statusCode).toBe(405);
  });

  test("rejects unauthenticated requests", async () => {
    const result = await handler(validEvent({ headers: {} }));
    expect(result.statusCode).toBe(401);
  });

  test("rejects invalid JSON", async () => {
    const result = await handler(validEvent({ body: "{" }));
    expect(result.statusCode).toBe(400);
  });

  test("rejects request bodies larger than 1MB", async () => {
    const result = await handler(validEvent({ body: "x".repeat(1024 * 1024 + 1) }));
    expect(result.statusCode).toBe(413);
  });

  test("rejects malformed or oversized chat parts", () => {
    expect(_test.validateChatHistory({ chatHistory: [{ role: "system", parts: [{ text: "x" }] }] }).valid).toBe(false);
    expect(_test.validateChatHistory({ chatHistory: [{ role: "user", parts: [{ text: "x".repeat(8001) }] }] }).valid).toBe(false);
  });

  test("normalizes escaped private-key newlines", () => {
    const parsed = _test.parseServiceAccount(account);
    expect(parsed.private_key).toContain("\nkey\n");
  });
});

describe("Netlify Gemini function security flow", () => {
  beforeEach(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT = account;
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockAdmin.apps.length = 0;
    mockAdmin.initializeApp.mockClear();
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "CIDR is a notation for network prefixes." }] } }] }),
    }));

    const transaction = {
      get: jest.fn(async () => ({ exists: false, data: () => undefined })),
      set: jest.fn(),
    };
    mockAdmin.firestore.mockReturnValue({
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async (callback) => callback(transaction),
    });
  });

  afterEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.GEMINI_API_KEY;
    delete global.fetch;
  });

  test("verifies the token, consumes a transaction, and returns the AI reply", async () => {
    const result = await handler(validEvent());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).reply).toMatch(/CIDR/);
    expect(mockAdmin.credential.cert).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("gemini-3.6-flash"), expect.any(Object));
  });

  test("returns configuration error without exposing secrets", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await handler(validEvent());
    expect(result.statusCode).toBe(500);
    expect(result.body).not.toContain("test-gemini-key");
  });
});
