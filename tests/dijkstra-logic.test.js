import { nodes, edges, buildGraph, dijkstra } from '../logic/dijkstra-logic.js';

describe('buildGraph', () => {
    test('ينشئ عقدة (node) لكل روتر بالشبكة', () => {
        const graph = buildGraph();
        expect(Object.keys(graph).sort()).toEqual(nodes.map(n => n.id).sort());
    });

    test('كل وصلة (edge) تظهر بالاتجاهين (شبكة غير موجهة)', () => {
        const graph = buildGraph();
        const aToC = graph['A'].find(n => n.node === 'C');
        const cToA = graph['C'].find(n => n.node === 'A');
        expect(aToC.cost).toBe(2);
        expect(cToA.cost).toBe(2);
    });
});

describe('dijkstra (إيجاد أقصر مسار)', () => {
    const graph = buildGraph();

    test('أقصر مسار من A إلى F عبر A-C-B-D-F بتكلفة إجمالية 14', () => {
        const { path, totalCost } = dijkstra(graph, 'A', 'F');
        expect(path).toEqual(['A', 'C', 'B', 'D', 'F']);
        expect(totalCost).toBe(14);
    });

    test('المسار من نفس العقدة لنفسها تكلفته صفر', () => {
        const { path, totalCost } = dijkstra(graph, 'A', 'A');
        expect(path).toEqual(['A']);
        expect(totalCost).toBe(0);
    });

    test('أقصر مسار مباشر بين جارين متصلين مباشرة', () => {
        const { path, totalCost } = dijkstra(graph, 'A', 'C');
        expect(path).toEqual(['A', 'C']);
        expect(totalCost).toBe(2);
    });

    test('عقدة معزولة بدون أي وصلات، ما فيه مسار إليها', () => {
        const isolatedNodes = [...nodes, { id: 'Z', x: 0, y: 0, label: 'Isolated' }];
        const isolatedGraph = buildGraph(isolatedNodes, edges);
        const { path, totalCost } = dijkstra(isolatedGraph, 'A', 'Z', isolatedNodes);
        expect(path).toEqual([]);
        expect(totalCost).toBe(Infinity);
    });
});
