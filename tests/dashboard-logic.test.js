import { aggregateUsage } from '../logic/dashboard-logic.js';
test('aggregates features and anomaly rate', () => { const r=aggregateUsage([{feature:'dijkstra'},{feature:'dijkstra',anomalous:true},{feature:'anomaly',anomalous:true}]); expect(r.totalActivities).toBe(3); expect(r.byFeature.dijkstra).toBe(2); expect(r.anomalyRate).toBe(67); });
