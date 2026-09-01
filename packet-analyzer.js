// ============================================
// NetXpert AI - محاكي تحليل الحزم (Packet Analyzer)
// محاكاة لتجربة Wireshark ببيانات وهمية واقعية الشكل
// ============================================

import { filterPackets } from "./logic/packet-filter-logic.js";

const PROTOCOLS = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP', 'ARP'];
const SAMPLE_IPS = [
    '192.168.1.1', '192.168.1.10', '192.168.1.25',
    '10.0.0.5', '172.16.0.8', '8.8.8.8', '1.1.1.1', '142.250.80.14'
];

const PROTOCOL_INFO = {
    TCP: ['SYN', 'SYN, ACK', 'ACK', 'FIN, ACK', 'PSH, ACK'],
    UDP: ['Source port: 53421 → Destination port: 53', 'Length 82'],
    HTTP: ['GET / HTTP/1.1', 'POST /login HTTP/1.1', '200 OK'],
    HTTPS: ['Client Hello', 'Server Hello', 'Application Data'],
    DNS: ['Standard query A example.com', 'Standard query response'],
    ICMP: ['Echo (ping) request', 'Echo (ping) reply'],
    ARP: ['Who has 192.168.1.1? Tell 192.168.1.10']
};

let allPackets = [];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePackets(count = 25) {
    const packets = [];
    let time = 0;

    for (let i = 1; i <= count; i++) {
        time += Math.random() * 0.8;
        const protocol = randomFrom(PROTOCOLS);
        packets.push({
            no: i,
            time: time.toFixed(6),
            source: randomFrom(SAMPLE_IPS),
            destination: randomFrom(SAMPLE_IPS),
            protocol,
            length: Math.floor(Math.random() * 1200) + 54,
            info: randomFrom(PROTOCOL_INFO[protocol])
        });
    }
    return packets;
}

function renderPackets(packets) {
    const tbody = document.getElementById('packetTableBody');
    tbody.innerHTML = '';

    if (packets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-packets">لا توجد نتائج مطابقة للفلتر</td></tr>`;
        return;
    }

    packets.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = `protocol-${p.protocol.toLowerCase()}`;
        tr.innerHTML = `
            <td>${p.no}</td>
            <td>${p.time}</td>
            <td>${p.source}</td>
            <td>${p.destination}</td>
            <td><span class="protocol-badge">${p.protocol}</span></td>
            <td>${p.length}</td>
            <td>${p.info}</td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFilter(filterText) {
    renderPackets(filterPackets(allPackets, filterText));
}

document.addEventListener('DOMContentLoaded', () => {
    allPackets = generatePackets();
    renderPackets(allPackets);

    document.getElementById('captureBtn').addEventListener('click', () => {
        allPackets = generatePackets();
        document.getElementById('packetFilter').value = '';
        renderPackets(allPackets);
    });

    document.getElementById('packetFilter').addEventListener('input', (e) => {
        applyFilter(e.target.value);
    });
});
