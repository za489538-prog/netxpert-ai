import { analyzeNetworkEvent, isPrivate } from '../logic/anomaly-logic.js';
test('detects repeated failed logins as anomaly', () => { const r=analyzeNetworkEvent({ip:'192.168.1.5',port:443,failedLogins:6}); expect(r.isAnomalous).toBe(true); expect(r.findings.map(f=>f.code)).toContain('AUTH_BURST'); });
test('recognizes private IPv4 ranges', () => { expect(isPrivate('10.1.2.3')).toBe(true); expect(isPrivate('8.8.8.8')).toBe(false); });
test('keeps normal private traffic low risk', () => { expect(analyzeNetworkEvent({ip:'192.168.1.10',port:443,connectionCount:2}).level).toBe('low'); });
