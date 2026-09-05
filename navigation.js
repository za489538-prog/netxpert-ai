// ============================================
// NetXpert AI - Navigation Controller
// يتحكم بالتبديل بين أقسام القائمة الجانبية
// ============================================

const navLinks = document.querySelectorAll('.nav-links a[data-view]');
const viewSections = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('pageTitle');

const titles = {
    subnetting: 'حاسبة الشبكات المتقدمة',
    algorithm: 'محاكي خوارزمية Dijkstra',
    wireshark: 'محاكي تحليل الحزم (Wireshark)',
    terminal: 'محاكي طرفية Linux',
    vlsm: 'حاسبة VLSM',
    compare: 'مقارنة عناوين IP',
    editor: 'محرر شبكة Dijkstra التفاعلي',
    anomaly: 'كشف الشذوذ بالذكاء الاصطناعي',
    dashboard: 'لوحة الإحصائيات والتقدم'
};

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;

        // تحديث الروابط النشطة
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // إظهار القسم المطلوب فقط
        viewSections.forEach(section => {
            section.style.display = section.id === `view-${targetView}` ? 'flex' : 'none';
        });

        // تحديث عنوان الصفحة
        if (pageTitle && titles[targetView]) {
            pageTitle.textContent = titles[targetView];
        }
    });
});
