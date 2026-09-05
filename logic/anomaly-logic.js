// Explainable, deterministic network anomaly scoring
const PRIVATE_RANGES = [{ start: 0x0a000000, end: 0x0affffff }, { start: 0xac100000, end: 0xac1fffff }, { start: 0xc0a80000, end: 0xc0a8ffff }];
function ipv4ToNumber(ip) { return ip.split('.').reduce((n, octet) => n * 256 + Number(octet), 0); }
export function isValidIPv4(ip) { return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every(o => Number(o) >= 0 && Number(o) <= 255); }
export function isPrivate(ip) { if (!isValidIPv4(ip)) return false; const n = ipv4ToNumber(ip); return PRIVATE_RANGES.some(r => n >= r.start && n <= r.end); }
export function analyzeNetworkEvent(event = {}) {
  const findings = []; let score = 0; const ip = String(event.ip || '').trim(); const bytes = Array.isArray(event.bytes) ? event.bytes.map(Number) : [];
  if (!isValidIPv4(ip)) { findings.push({ severity: 'high', code: 'INVALID_IP', message: 'عنوان IPv4 غير صالح أو غير متوقع.' }); score += 60; }
  else if (!isPrivate(ip)) { findings.push({ severity: 'medium', code: 'PUBLIC_SOURCE', message: 'المصدر عنوان عام؛ راجع قاعدة الوصول.' }); score += 25; }
  if (Number(event.port) < 1 || Number(event.port) > 65535) { findings.push({ severity: 'medium', code: 'INVALID_PORT', message: 'المنفذ خارج المجال القياسي.' }); score += 25; }
  if (bytes.some(b => b < 0 || b > 255 || !Number.isInteger(b))) { findings.push({ severity: 'medium', code: 'MALFORMED_PAYLOAD', message: 'الحمولة تحتوي قيماً غير صالحة.' }); score += 20; }
  if (Number(event.connectionCount) > 100) { findings.push({ severity: 'high', code: 'CONNECTION_BURST', message: 'عدد الاتصالات مرتفع جداً.' }); score += 35; }
  if (Number(event.failedLogins) >= 5) { findings.push({ severity: 'high', code: 'AUTH_BURST', message: 'محاولات دخول فاشلة متكررة.' }); score += 35; }
  score = Math.min(100, score); return { score, level: score >= 70 ? 'high' : score >= 30 ? 'medium' : 'low', findings, isAnomalous: score >= 30 };
}
