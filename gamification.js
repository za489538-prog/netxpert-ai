import { addPoints, emptyScore, BADGES } from './logic/gamification-logic.js';
import { aggregateUsage } from './logic/dashboard-logic.js';
const SCORE_KEY = 'netxpert-score-v1';
const EVENTS_KEY = 'netxpert-events-v1';
export function getScore() { try { return JSON.parse(localStorage.getItem(SCORE_KEY)) || emptyScore(); } catch { return emptyScore(); } }
export function recordActivity(feature, extra = {}) {
  const score = addPoints(getScore(), feature);
  localStorage.setItem(SCORE_KEY, JSON.stringify(score));
  let events = []; try { events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch {}
  events.push({ feature, at: new Date().toISOString(), ...extra });
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-500)));
  renderScore(); renderDashboard(); return score;
}
function renderScore() { const el = document.getElementById('scoreWidget'); if (!el) return; const score = getScore(); el.innerHTML = `<strong>⭐ ${score.points}</strong><span>المستوى ${score.level}</span><small>${score.badges.length} شارات مكتسبة</small>`; }
function renderDashboard() { const el = document.getElementById('dashboardStats'); if (!el) return; let events = []; try { events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch {} const stats = aggregateUsage(events); el.innerHTML = `<div class="metric-grid"><div class="metric"><b>${stats.totalActivities}</b><span>إجمالي النشاطات</span></div><div class="metric"><b>${stats.anomalyCount}</b><span>تنبيهات شذوذ</span></div><div class="metric"><b>${stats.anomalyRate}%</b><span>معدل الشذوذ</span></div></div><h4>النشاط حسب الأداة</h4><ul class="stats-list">${Object.entries(stats.byFeature).map(([k,v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('') || '<li>لا توجد بيانات بعد</li>'}</ul>`; }
export function initGamification() { renderScore(); renderDashboard(); document.querySelectorAll('[data-feature]').forEach(button => button.addEventListener('click', () => recordActivity(button.dataset.feature))); [['calcBtn','subnet'], ['vlsmCalcBtn','vlsm'], ['compareBtn','compare'], ['findPathBtn','dijkstra']].forEach(([id, feature]) => document.getElementById(id)?.addEventListener('click', () => recordActivity(feature))); const badgeEl = document.getElementById('badgesList'); if (badgeEl) badgeEl.innerHTML = BADGES.map(b => `<span class="badge" data-threshold="${b.threshold}">${b.name} · ${b.threshold} نقطة</span>`).join(''); }
document.addEventListener('DOMContentLoaded', initGamification);
