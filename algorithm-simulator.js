// ============================================
// NetXpert AI - محاكي خوارزمية Dijkstra
// إيجاد أقصر مسار بين الروترات داخل شبكة
// ============================================

// الشبكة (Nodes/Edges) وخوارزمية Dijkstra منقولين لملف logic/dijkstra-logic.js
// (قابل للاختبار بـ Jest بمعزل عن الـ DOM)
import { nodes, edges, buildGraph, dijkstra } from "./logic/dijkstra-logic.js";

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
