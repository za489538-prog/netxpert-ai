// ============================================
// NetXpert AI - Netlify Function: gemini-chat
// ============================================
// هاد الملف بيشتغل على السيرفر (Netlify) مش عند المستخدم بالمتصفح.
// هو المسؤول الوحيد عن التواصل مع Gemini API، وبالتالي الـ API Key
// بيضل محفوظ بمتغيرات البيئة (Environment Variables) على Netlify
// وما بينكشف أبداً لأي زائر بالموقع.
//
// ⚠️ إعداد مطلوب على Netlify (مرة وحدة فقط):
// Site settings -> Environment variables -> أضف متغير باسم:
//   GEMINI_API_KEY = المفتاح_الجديد_من_AI_Studio
// ============================================

const GEMINI_MODEL = "gemini-3.6-flash";

const SYSTEM_CONTEXT = `أنت مساعد تقني متخصص بالشبكات (Networking) وأنظمة IT، تعمل داخل منصة NetXpert AI.
جاوب بالعربية بشكل واضح ومختصر، وركز على مواضيع الشبكات، الـ Subnetting، الـ IP addressing، وأمن المعلومات.`;

// حد أقصى بسيط لعدد الرسائل بالمحادثة الواحدة، تحسباً لإساءة الاستخدام
const MAX_HISTORY_MESSAGES = 40;

export default async (req) => {
  // نسمح فقط بطلبات POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY غير معرّف بمتغيرات البيئة على Netlify.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body غير صالح (JSON)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chatHistory = Array.isArray(payload?.chatHistory) ? payload.chatHistory : [];

  // تحقق بسيط من شكل البيانات عشان ما حدا يبعت حمولة غريبة
  if (chatHistory.length === 0 || chatHistory.length > MAX_HISTORY_MESSAGES) {
    return new Response(
      JSON.stringify({ error: "chatHistory فاضي أو تجاوز الحد المسموح" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
        systemInstruction: { parts: [{ text: SYSTEM_CONTEXT }] },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || `Gemini HTTP ${geminiRes.status}` }),
        { status: geminiRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ما قدرت أفهم السؤال، حاول تصيغه بطريقة ثانية.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "فشل الاتصال بـ Gemini API" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
