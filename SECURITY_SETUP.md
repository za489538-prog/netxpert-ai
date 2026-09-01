# خطوات تأمين Gemini API Key (الشهر 1 - المهمة 1)

## 1. ألغِ المفتاح القديم فوراً
المفتاح اللي كان مكتوب بـ `ai-assistant.js` أصبح مكشوفاً. روح على
https://aistudio.google.com/app/apikey واعمل **Delete** له، وأنشئ مفتاح جديد.

## 2. ما تغيّر بالمشروع
- `ai-assistant.js`: عاد ما فيه أي API key. صار يبعث الأسئلة إلى `/api/gemini-chat`.
- `netlify/functions/gemini-chat.js`: Serverless Function جديدة، هي الوحيدة اللي
  بتتواصل مع Gemini API، والمفتاح عندها بيجي من متغيرات البيئة مش مكتوب بالكود.
- `netlify.toml`: يربط `/api/*` بمجلد الـ functions ويحدد إعدادات النشر.

## 3. النشر على Netlify
1. ادفع المشروع (بما فيه `netlify.toml` ومجلد `netlify/functions`) على GitHub.
2. من [app.netlify.com](https://app.netlify.com) اعمل **Add new site -> Import an existing project**
   واربطه بالـ repo.
3. Build settings تقدر تخليها فاضية (المشروع Static HTML) — بس تأكد
   إن **Publish directory** هو الجذر (`.`).
4. روح على **Site settings -> Environment variables** وأضف:
   - Key: `GEMINI_API_KEY`
   - Value: المفتاح الجديد اللي عملته بالخطوة 1
5. اعمل **Deploy**. Netlify رح يكتشف مجلد `netlify/functions` أوتوماتيكياً
   وينشر `gemini-chat` كـ endpoint على `/.netlify/functions/gemini-chat`
   (واللي بيتوصله كمان عبر `/api/gemini-chat` بفضل الـ redirect بملف `netlify.toml`).

## 4. تجربة محلية (اختياري)
```bash
npm install -g netlify-cli
netlify dev
```
هاد بيشغل الموقع + الـ Function محلياً على نفس البورت، وبياخذ متغيرات البيئة
من ملف `.env` لو عملته محلياً (لا ترفعه لـ GitHub — ضيفه بـ `.gitignore`).

## 5. تحقق نهائي
- افتح الموقع بعد النشر، جرب المساعد الذكي، وتأكد إنه يرد بشكل طبيعي.
- افتح Developer Tools -> Network، وتأكد إن الطلب رايح على `/api/gemini-chat`
  وما فيه أي أثر لأي API key بالـ Request أو بالـ Response أو بكود الصفحة.
