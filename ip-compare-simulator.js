// ============================================
// NetXpert AI - واجهة مقارنة عناوين IP
// يعرض النتيجة النصية + تمثيل ثنائي ملوّن للبتات المختلفة
// ============================================

import { compareIPAddresses } from './logic/ip-compare-logic.js';

function renderBinaryRow(container, ip, octets, bitDiff) {
    container.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'binary-row-label';
    label.textContent = ip;
    container.appendChild(label);

    const bitsWrap = document.createElement('span');
    bitsWrap.className = 'binary-row-bits';

    let bitIndex = 0;
    octets.forEach((octet, octetIndex) => {
        const octetSpan = document.createElement('span');
        octetSpan.className = 'binary-octet';

        for (const char of octet) {
            const bitSpan = document.createElement('span');
            bitSpan.className = 'bit' + (bitDiff[bitIndex] ? ' bit-diff' : '');
            bitSpan.textContent = char;
            octetSpan.appendChild(bitSpan);
            bitIndex++;
        }

        bitsWrap.appendChild(octetSpan);
        if (octetIndex < octets.length - 1) {
            const dot = document.createElement('span');
            dot.className = 'binary-octet-dot';
            dot.textContent = '.';
            bitsWrap.appendChild(dot);
        }
    });

    container.appendChild(bitsWrap);
}

document.addEventListener('DOMContentLoaded', () => {
    const ip1Input = document.getElementById('compareIp1');
    const ip2Input = document.getElementById('compareIp2');
    const cidrInput = document.getElementById('compareCidr');
    const compareBtn = document.getElementById('compareBtn');
    const errorBox = document.getElementById('compareError');
    const resultWrap = document.getElementById('compareResult');
    const summaryBox = document.getElementById('compareSummary');
    const binaryRow1 = document.getElementById('binaryRow1');
    const binaryRow2 = document.getElementById('binaryRow2');

    if (!compareBtn) return; // هذا القسم مو موجود بالصفحة الحالية

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        resultWrap.style.display = 'none';
    }

    function clearError() {
        errorBox.style.display = 'none';
    }

    function renderSummary(r) {
        const rows = [];

        rows.push(['العنوان الأول', r.ip1]);
        rows.push(['العنوان الثاني', r.ip2]);
        rows.push(['المقارنة الرقمية', r.areEqual ? 'العنوانان متساويان' : `${r.largerAddress} هو الأكبر`]);
        rows.push(['عدد البتات المشتركة من البداية', `${r.commonPrefixLength} بت`]);
        rows.push(['أصغر شبكة مشتركة تجمعهما', `${r.smallestCommonNetwork.address}/${r.smallestCommonNetwork.cidr}`]);

        if ('sameNetwork' in r) {
            rows.push([`بنفس الشبكة تحت /${r.cidr}؟`, r.sameNetwork ? 'نعم ✅' : 'لا ❌']);
        }

        summaryBox.innerHTML = `
            <table>
                ${rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}
            </table>
        `;
    }

    compareBtn.addEventListener('click', () => {
        clearError();

        const ip1 = ip1Input.value.trim();
        const ip2 = ip2Input.value.trim();
        const cidrRaw = cidrInput.value.trim();
        const cidr = cidrRaw === '' ? null : parseInt(cidrRaw, 10);

        if (!ip1 || !ip2) {
            return showError('الرجاء إدخال العنوانين.');
        }

        let result;
        try {
            result = compareIPAddresses(ip1, ip2, cidr);
        } catch (err) {
            return showError(err.message);
        }

        renderSummary(result);
        renderBinaryRow(binaryRow1, result.ip1, result.binary1, result.bitDiff);
        renderBinaryRow(binaryRow2, result.ip2, result.binary2, result.bitDiff);

        resultWrap.style.display = 'block';
    });
});
