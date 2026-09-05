// ============================================
// NetXpert AI - واجهة حاسبة VLSM
// يدير صفوف الشبكات الفرعية الديناميكية ويعرض النتائج
// ============================================

import { calculateVLSM } from './logic/vlsm-logic.js';

let rowCounter = 0;

function createRequirementRow(defaultName = '', defaultHosts = '') {
    rowCounter++;
    const rowId = `vlsm-row-${rowCounter}`;

    const row = document.createElement('div');
    row.className = 'vlsm-requirement-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="vlsm-req-name" placeholder="اسم الشبكة (مثال: Sales)" value="${defaultName}">
        <input type="number" class="vlsm-req-hosts" placeholder="عدد الأجهزة" min="1" value="${defaultHosts}">
        <button type="button" class="vlsm-remove-btn" title="حذف">✕</button>
    `;

    row.querySelector('.vlsm-remove-btn').addEventListener('click', () => row.remove());

    return row;
}

function renderVlsmResult(results) {
    const tbody = document.getElementById('vlsmResultBody');
    const wrap = document.getElementById('vlsmResult');
    tbody.innerHTML = '';

    results.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.requestedHosts}</td>
            <td>/${r.prefix}</td>
            <td>${r.subnetMask}</td>
            <td>${r.networkAddress}</td>
            <td>${r.broadcastAddress}</td>
            <td>${r.firstHost} - ${r.lastHost}</td>
            <td>${r.usableHosts.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });

    wrap.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const requirementsList = document.getElementById('vlsmRequirementsList');
    const addRowBtn = document.getElementById('vlsmAddRowBtn');
    const calcBtn = document.getElementById('vlsmCalcBtn');
    const errorBox = document.getElementById('vlsmError');
    const baseIpInput = document.getElementById('vlsmBaseIp');
    const baseCidrInput = document.getElementById('vlsmBaseCidr');

    if (!requirementsList) return; // هذا القسم مو موجود بالصفحة الحالية

    // ابدأ بصفين افتراضيين كمثال (نفس المثال الكلاسيكي بمناهج الشبكات)
    requirementsList.appendChild(createRequirementRow('Sales', 50));
    requirementsList.appendChild(createRequirementRow('IT', 20));

    addRowBtn.addEventListener('click', () => {
        requirementsList.appendChild(createRequirementRow());
    });

    calcBtn.addEventListener('click', () => {
        errorBox.style.display = 'none';
        document.getElementById('vlsmResult').style.display = 'none';

        const baseIp = baseIpInput.value.trim();
        const baseCidr = parseInt(baseCidrInput.value, 10);

        const rows = [...requirementsList.querySelectorAll('.vlsm-requirement-row')];
        if (rows.length === 0) {
            errorBox.textContent = 'أضف شبكة فرعية واحدة على الأقل.';
            errorBox.style.display = 'block';
            return;
        }

        const requirements = [];
        for (const row of rows) {
            const name = row.querySelector('.vlsm-req-name').value.trim();
            const hosts = parseInt(row.querySelector('.vlsm-req-hosts').value, 10);

            if (!name) {
                errorBox.textContent = 'كل شبكة فرعية لازم يكون إلها اسم.';
                errorBox.style.display = 'block';
                return;
            }
            if (!hosts || hosts < 1) {
                errorBox.textContent = `عدد الأجهزة لـ "${name}" لازم يكون رقم أكبر من صفر.`;
                errorBox.style.display = 'block';
                return;
            }
            requirements.push({ name, hosts });
        }

        try {
            const results = calculateVLSM(baseIp, baseCidr, requirements);
            renderVlsmResult(results);
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = 'block';
        }
    });
});
