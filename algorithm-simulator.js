// ============================================
// NetXpert AI - محاكي خوارزمية Dijkstra
// إيجاد أقصر مسار بين الروترات داخل شبكة
// ============================================

// شبكة ثابتة من الروترات (Nodes) والوصلات بينها (Edges) بتكلفة كل وصلة
const nodes = [
    { id: 'A', x: 80, y: 200, label: 'Router A' },
    { id: 'B', x: 250, y: 90, label: 'Router B' },
    { id: 'C', x: 250, y: 310, label: 'Router C' },
    { id: 'D', x: 420, y: 90, label: 'Router D' },
    { id: 'E', x: 420, y: 310, label: 'Router E' },
    { id: 'F', x: 590, y: 200, label: 'Router F' }
];

const edges = [
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
function buildGraph() {
    const graph = {};
    nodes.forEach(n => graph[n.id] = []);
    edges.forEach(e => {
        graph[e.from].push({ node: e.to, cost: e.cost });
        graph[e.to].push({ node: e.from, cost: e.cost });
    });
    return graph;
}

// خوارزمية Dijkstra الفعلية
function dijkstra(graph, source, destination) {
    const distances = {};
    const previous = {};
    const visited = new Set();

    nodes.forEach(n => distances[n.id] = Infinity);
    distances[source] = 0;

    while (visited.size < nodes.length) {
        // اختر العقدة غير المزارة الأقرب
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

    // إعادة بناء المسار من النهاية للبداية
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

// ---------- بناء واجهة الاختيار (Dropdowns) ----------
function populateSelects() {
    const sourceSelect = document.getElementById('sourceSelect');
    const destSelect = document.getElementById('destSelect');

    nodes.forEach(n => {
        const opt1 = document.createElement('option');
        opt1.value = n.id;
        opt1.textContent = n.label;
        sourceSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = n.id;
        opt2.textContent = n.label;
        destSelect.appendChild(opt2);
    });

    sourceSelect.value = 'A';
    destSelect.value = 'F';
}

// ---------- رسم الشبكة بـ SVG ----------
function drawGraph(highlightPath = []) {
    const svg = document.getElementById('algoSvg');
    svg.innerHTML = '';

    const isEdgeInPath = (from, to) => {
        for (let i = 0; i < highlightPath.length - 1; i++) {
            if ((highlightPath[i] === from && highlightPath[i + 1] === to) ||
                (highlightPath[i] === to && highlightPath[i + 1] === from)) {
                return true;
            }
        }
        return false;
    };

    // ارسم الوصلات (Edges) أولاً
    edges.forEach(e => {
        const fromNode = nodes.find(n => n.id === e.from);
        const toNode = nodes.find(n => n.id === e.to);
        const active = isEdgeInPath(e.from, e.to);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('stroke', active ? '#10B981' : '#475569');
        line.setAttribute('stroke-width', active ? '4' : '2');
        svg.appendChild(line);

        // كتابة التكلفة بمنتصف الوصلة
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY - 6);
        text.setAttribute('fill', '#94A3B8');
        text.setAttribute('font-size', '13');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = e.cost;
        svg.appendChild(text);
    });

    // ارسم الروترات (Nodes) فوق الوصلات
    nodes.forEach(n => {
        const inPath = highlightPath.includes(n.id);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', n.x);
        circle.setAttribute('cy', n.y);
        circle.setAttribute('r', 24);
        circle.setAttribute('fill', inPath ? '#10B981' : '#334155');
        circle.setAttribute('stroke', '#38BDF8');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', n.x);
        label.setAttribute('y', n.y + 5);
        label.setAttribute('fill', '#F8FAFC');
        label.setAttribute('font-size', '16');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = n.id;
        svg.appendChild(label);
    });
}

// ---------- ربط الأحداث ----------
document.addEventListener('DOMContentLoaded', () => {
    populateSelects();
    drawGraph();

    document.getElementById('findPathBtn').addEventListener('click', () => {
        const source = document.getElementById('sourceSelect').value;
        const destination = document.getElementById('destSelect').value;
        const resultBox = document.getElementById('algoResult');

        if (source === destination) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `<p>⚠️ اختر روترين مختلفين.</p>`;
            drawGraph();
            return;
        }

        const graph = buildGraph();
        const { path, totalCost } = dijkstra(graph, source, destination);

        drawGraph(path);

        resultBox.style.display = 'block';
        if (path.length === 0) {
            resultBox.innerHTML = `<p>❌ لا يوجد مسار متاح بين ${source} و ${destination}.</p>`;
        } else {
            resultBox.innerHTML = `
                <p><strong>أقصر مسار:</strong> ${path.join(' → ')}</p>
                <p><strong>عدد القفزات (Hops):</strong> ${path.length - 1}</p>
                <p><strong>التكلفة الإجمالية:</strong> ${totalCost}</p>
            `;
        }
    });
});
