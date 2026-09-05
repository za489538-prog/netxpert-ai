import { addPoints, emptyScore } from '../logic/gamification-logic.js';
test('awards action points and level', () => { const score=addPoints(emptyScore(),'dijkstra'); expect(score.points).toBe(25); expect(score.level).toBe(1); });
test('unlocks badges at thresholds', () => { let score=emptyScore(); for(let i=0;i<10;i++) score=addPoints(score,'subnet'); expect(score.points).toBe(100); expect(score.badges).toContain('algorithmist'); });
