// ============================================
// NetXpert AI - Main App
// (Subnetting Calculator + Firebase Auth + Firestore History)
// ============================================

import { auth, db } from "./firebase-config.js";
import { isValidIp, calculateSubnet } from "./logic/subnet-logic.js";
import { isIPv6, isValidIPv6, calculateIPv6Subnet } from "./logic/ipv6-logic.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------- عناصر DOM ----------
const ipInput = document.getElementById('ipInput');
const cidrInput = document.getElementById('cidrInput');
const cidrValue = document.getElementById('cidrValue');
const calcBtn = document.getElementById('calcBtn');
const resultBox = document.getElementById('result');
const errorBox = document.getElementById('errorBox');
const ipVersionBadge = document.getElementById('ipVersionBadge');

const authBtn = document.getElementById('authBtn');
const userStatus = document.getElementById('userStatus');
const authModal = document.getElementById('authModal');
const authModalTitle = document.getElementById('authModalTitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authError = document.getElementById('authError');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchToRegister = document.getElementById('switchToRegister');

const historyCard = document.getElementById('historyCard');
const historyList = document.getElementById('historyList');

let currentUser = null;
let authMode = 'login'; // 'login' or 'register'
let unsubscribeHistory = null;

// ---------- اكتشاف نوع العنوان (IPv4 / IPv6) أثناء الكتابة ----------
if (ipVersionBadge) {
    ipInput.addEventListener('input', () => {
        const value = ipInput.value.trim();

        if (!value) {
            ipVersionBadge.style.display = 'none';
            return;
        }

        if (isIPv6(value)) {
            ipVersionBadge.textContent = 'تم اكتشاف عنوان IPv6';
            ipVersionBadge.className = 'ip-version-badge badge-v6';
            ipVersionBadge.style.display = 'inline-block';
            if (cidrInput.max !== '128') {
                cidrInput.max = 128;
                cidrInput.value = 64;
                cidrValue.textContent = 64;
            }
        } else {
            ipVersionBadge.textContent = 'تم اكتشاف عنوان IPv4';
            ipVersionBadge.className = 'ip-version-badge badge-v4';
            ipVersionBadge.style.display = 'inline-block';
            if (cidrInput.max !== '32') {
                cidrInput.max = 32;
                if (parseInt(cidrInput.value, 10) > 32) {
                    cidrInput.value = 24;
                    cidrValue.textContent = 24;
                }
            }
        }
    });
}

// ---------- Subnetting: المنطق منقول لملف logic/subnet-logic.js (قابل للاختبار بـ Jest) ----------
cidrInput.addEventListener('input', () => {
    cidrValue.textContent = cidrInput.value;
});

function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    resultBox.style.display = 'none';
}

function clearError() {
    errorBox.style.display = 'none';
}

function renderResult(data) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <table>
            <tr><td>عنوان IP</td><td>${data.ip}</td></tr>
            <tr><td>Subnet Mask</td><td>${data.subnetMask} (/${data.cidr})</td></tr>
            <tr><td>Network Address</td><td>${data.networkAddress}</td></tr>
            <tr><td>Broadcast Address</td><td>${data.broadcastAddress}</td></tr>
            <tr><td>أول IP صالح</td><td>${data.firstHost}</td></tr>
            <tr><td>آخر IP صالح</td><td>${data.lastHost}</td></tr>
            <tr><td>إجمالي العناوين</td><td>${data.totalHosts.toLocaleString()}</td></tr>
            <tr><td>عدد Hosts القابلة للاستخدام</td><td>${data.usableHosts.toLocaleString()}</td></tr>
            <tr><td>فئة العنوان (Class)</td><td>${data.ipClass}</td></tr>
            <tr><td>نوع العنوان</td><td>${data.isPrivate ? 'خاص (Private) 🔒' : 'عام (Public) 🌐'}</td></tr>
        </table>
    `;
}

function renderIPv6Result(data) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <table>
            <tr><td>عنوان IPv6</td><td>${data.ip}</td></tr>
            <tr><td>Prefix Length</td><td>/${data.prefix}</td></tr>
            <tr><td>Network Address</td><td>${data.networkAddress}</td></tr>
            <tr><td>آخر عنوان بالنطاق</td><td>${data.lastAddress}</td></tr>
            <tr><td>إجمالي العناوين</td><td>${data.totalAddresses}</td></tr>
            <tr><td>نوع العنوان</td><td>${data.addressType}</td></tr>
        </table>
        <p class="ipv6-note">💡 ملاحظة: IPv6 لا يستخدم مفهوم Broadcast مثل IPv4 — بديله الرسمي هو Multicast.</p>
    `;
}

calcBtn.addEventListener('click', async function () {
    const ip = ipInput.value.trim();
    const cidr = parseInt(cidrInput.value, 10);

    clearError();

    if (!ip) return showError('الرجاء إدخال عنوان IP.');

    // ---------- IPv6 ----------
    if (isIPv6(ip)) {
        if (!isValidIPv6(ip)) return showError('عنوان الـ IPv6 غير صحيح. تأكد من الصيغة (مثال: 2001:db8::1)');

        const data = calculateIPv6Subnet(ip, cidr);
        renderIPv6Result(data);

        if (currentUser) {
            try {
                await addDoc(collection(db, 'users', currentUser.uid, 'history'), {
                    ip: data.ip,
                    cidr: data.prefix,
                    networkAddress: data.networkAddress,
                    broadcastAddress: 'N/A (IPv6)',
                    createdAt: serverTimestamp()
                });
            } catch (err) {
                console.error('فشل حفظ السجل:', err);
            }
        }
        return;
    }

    // ---------- IPv4 ----------
    if (!isValidIp(ip)) return showError('عنوان الـ IP غير صحيح. تأكد من الصيغة (مثال: 192.168.1.1)');

    const data = calculateSubnet(ip, cidr);
    renderResult(data);

    // احفظ العملية في Firestore لو المستخدم مسجل دخول
    if (currentUser) {
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'history'), {
                ip: data.ip,
                cidr: data.cidr,
                networkAddress: data.networkAddress,
                broadcastAddress: data.broadcastAddress,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error('فشل حفظ السجل:', err);
        }
    }
});

ipInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') calcBtn.click();
});

// ---------- Auth: تسجيل الدخول / إنشاء حساب / تسجيل الخروج ----------
function openAuthModal(mode) {
    authMode = mode;
    authModalTitle.textContent = mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
    authSubmitBtn.textContent = mode === 'login' ? 'دخول' : 'إنشاء الحساب';
    switchToRegister.textContent = mode === 'login' ? 'أنشئ حساب جديد' : 'سجل دخولك';
    authEmail.value = '';
    authPassword.value = '';
    authError.style.display = 'none';
    authModal.classList.add('open');
}

function closeModal(modal) {
    modal.classList.remove('open');
}

authBtn.addEventListener('click', () => {
    if (currentUser) {
        signOut(auth);
    } else {
        openAuthModal('login');
    }
});

switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(authMode === 'login' ? 'register' : 'login');
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.close)));
});

authSubmitBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    authError.style.display = 'none';

    if (!email || !password) {
        authError.textContent = 'الرجاء تعبئة كل الحقول.';
        authError.style.display = 'block';
        return;
    }

    try {
        if (authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        closeModal(authModal);
    } catch (err) {
        authError.textContent = translateFirebaseError(err.code);
        authError.style.display = 'block';
    }
});

function translateFirebaseError(code) {
    const map = {
        'auth/email-already-in-use': 'هذا البريد مستخدم مسبقاً.',
        'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
        'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل).',
        'auth/user-not-found': 'المستخدم غير موجود.',
        'auth/wrong-password': 'كلمة المرور غير صحيحة.',
        'auth/invalid-credential': 'بيانات الدخول غير صحيحة.'
    };
    return map[code] || 'حدث خطأ، حاول مرة أخرى.';
}

// ---------- مراقبة حالة تسجيل الدخول ----------
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
        userStatus.textContent = user.email;
        authBtn.textContent = 'تسجيل الخروج';
        historyCard.style.display = 'block';
        listenToHistory(user.uid);
    } else {
        userStatus.textContent = 'غير مسجل الدخول';
        authBtn.textContent = 'تسجيل الدخول';
        historyCard.style.display = 'none';
        if (unsubscribeHistory) unsubscribeHistory();
        historyList.innerHTML = '';
    }
});

// ---------- الاستماع لسجل العمليات (Realtime) ----------
function listenToHistory(uid) {
    if (unsubscribeHistory) unsubscribeHistory();

    const historyQuery = query(
        collection(db, 'users', uid, 'history'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );

    unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        historyList.innerHTML = '';
        snapshot.forEach(doc => {
            const item = doc.data();
            const li = document.createElement('li');
            const date = item.createdAt ? item.createdAt.toDate().toLocaleString('ar-EG') : '...';
            li.innerHTML = `<span>${item.ip}/${item.cidr}</span><span class="history-date">${date}</span>`;
            historyList.appendChild(li);
        });
    });
}
