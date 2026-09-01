// ============================================
// NetXpert AI - منطق خوارزمية Dijkstra (Pure Logic)
// نفس الشبكة الثابتة المستخدمة بالمحاكي، بدون أي DOM
// ============================================

export const nodes = [
    { id: 'A', x: 80, y: 200, label: 'Router A' },
    { id: 'B', x: 250, y: 90, label: 'Router B' },
    { id: 'C', x: 250, y: 310, label: 'Router C' },
    { id: 'D', x: 420, y: 90, label: 'Router D' },
    { id: 'E', x: 420, y: 310, label: 'Router E' },
    { id: 'F', x: 590, y: 200, label: 'Router F' }
];

export const edges = [
    { from: 'A', to: 'B', cost: 4 },
    { from: 'A', to: 'C', cost: 2 },
    { from: 'B', to: 'D', cost: 5 },
    { from: 'C', to: 'B', cost: 1 },
    { from: 'C', to: 'E', cost: 8 },
    { from: 'D', to: 'F', cost: 6 },
    { from: 'D', to: 'E', cost: 3 },
    { from: 'E', to: 'F', cost: 4 }
];

// بناء قائمة الجيران (Adjacency List) - الشبكة ثنائية الاتجاه
export function buildGraph(nodeList = nodes, edgeList = edges) {
    const graph = {};
    nodeList.forEach(n => graph[n.id] = []);
    edgeList.forEach(e => {
        graph[e.from].push({ node: e.to, cost: e.cost });
        graph[e.to].push({ node: e.from, cost: e.cost });
    });
    return graph;
}

// خوارزمية Dijkstra الفعلية
export function dijkstra(graph, source, destination, nodeList = nodes) {
    const distances = {};
    const previous = {};
    const visited = new Set();

    nodeList.forEach(n => distances[n.id] = Infinity);
    distances[source] = 0;

    while (visited.size < nodeList.length) {
        let current = null;
        let minDist = Infinity;
        for (const nodeId in distances) {
            if (!visited.has(nodeId) && distances[nodeId] < minDist) {
                minDist = distances[nodeId];
                current = nodeId;
            }
        }

        if (current === null) break;
        visited.add(current);

        if (current === destination) break;

        graph[current].forEach(neighbor => {
            const newDist = distances[current] + neighbor.cost;
            if (newDist < distances[neighbor.node]) {
                distances[neighbor.node] = newDist;
                previous[neighbor.node] = current;
            }
        });
    }

    const path = [];
    let step = destination;
    while (step !== undefined) {
        path.unshift(step);
        step = previous[step];
    }

    return {
        path: distances[destination] === Infinity ? [] : path,
        totalCost: distances[destination]
    };
}
