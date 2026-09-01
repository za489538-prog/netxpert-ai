// ============================================
// NetXpert AI - المساعد الذكي (AI Assistant)
// ============================================
// ✅ بعد التحديث: الملف ما عاد يحتوي على أي API Key.
// كل طلب بيروح لـ Netlify Function (/api/gemini-chat) وهي
// اللي بتتواصل مع Gemini API من طرف السيرفر، بحيث المفتاح
// يضل محفوظ بمتغيرات البيئة على Netlify ولا ينكشف أبداً بالمتصفح.
//
// محلياً (بدون نشر على Netlify) استخدم "netlify dev" عشان الـ Function
// تشتغل على نفس البورت مع باقي الموقع.
// ============================================

const CHAT_ENDPOINT = "/api/gemini-chat";

const aiBtn = document.getElementById('aiBtn');
const aiModal = document.getElementById('aiModal');
const aiChatWindow = document.getElementById('aiChatWindow');
const aiInput = document.getElementById('aiInput');
const aiSendBtn = document.getElementById('aiSendBtn');

let chatHistory = [];

aiBtn.addEventListener('click', () => {
    aiModal.classList.add('open');
});

function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `ai-msg ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;
    div.textContent = text;
    aiChatWindow.appendChild(div);
    aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
}

async function sendToGemini(userMessage) {
    // نبني سياق المحادثة كامل عشان المساعد يتذكر الكلام السابق
    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
    }

    const reply = data?.reply || 'ما قدرت أفهم السؤال، حاول تصيغه بطريقة ثانية.';

    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    return reply;
}

async function handleSend() {
    const message = aiInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    aiInput.value = '';
    aiInput.disabled = true;
    aiSendBtn.disabled = true;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-msg ai-msg-bot';
    typingIndicator.textContent = 'يكتب...';
    aiChatWindow.appendChild(typingIndicator);
    aiChatWindow.scrollTop = aiChatWindow.scrollHeight;

    try {
        const reply = await sendToGemini(message);
        typingIndicator.remove();
        appendMessage(reply, 'bot');
    } catch (err) {
        typingIndicator.remove();
        appendMessage(`صار خطأ بالاتصال: ${err.message}`, 'bot');
        console.error(err);
    } finally {
        aiInput.disabled = false;
        aiSendBtn.disabled = false;
        aiInput.focus();
    }
}

aiSendBtn.addEventListener('click', handleSend);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});
