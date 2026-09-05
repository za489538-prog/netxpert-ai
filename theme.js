// ============================================
// NetXpert AI - تبديل الوضع الليلي/النهاري
// يحفظ اختيار المستخدم بالمتصفح (localStorage) عشان يفضل بنفس الوضع بالمرة الجاية
// ============================================

const THEME_KEY = 'netxpert-theme';
const themeToggleBtn = document.getElementById('themeToggleBtn');

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙';
    }
}

// عند تحميل الصفحة: استرجع الوضع المحفوظ سابقاً، أو استخدم تفضيل نظام التشغيل
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        applyTheme(savedTheme);
        return;
    }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
}

themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
});

initTheme();
