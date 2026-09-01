// ============================================
// Firebase Configuration
// ============================================
// ⚠️ مهم جداً: استبدل القيم تحت بالقيم الحقيقية
// اللي بتاخذها من Firebase Console:
// https://console.firebase.google.com
// -> Project Settings -> General -> Your apps -> SDK setup and configuration
//
// خطوات سريعة:
// 1. روح على console.firebase.google.com وسوي مشروع جديد
// 2. من القائمة الجانبية: Build -> Authentication -> فعّل "Email/Password"
// 3. من القائمة الجانبية: Build -> Firestore Database -> أنشئ قاعدة بيانات
//    (اختر "Start in test mode" مبدئياً عشان التطوير السريع)
// 4. من Project Settings انسخ الـ firebaseConfig وحطه هنا بدل القيم تحت
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd1Ksr-tzCP8KEZBUia3LHLqb544VnIq8",
  authDomain: "pixelsite-ba8d4.firebaseapp.com",
  projectId: "pixelsite-ba8d4",
  storageBucket: "pixelsite-ba8d4.firebasestorage.app",
  messagingSenderId: "909989988048",
  appId: "1:909989988048:web:8a33a200af85277d1780d5",
  measurementId: "G-JB3JFXXFHV"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
