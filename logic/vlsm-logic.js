// ============================================
// NetXpert AI - منطق حاسبة VLSM (Variable Length Subnet Masking)
// يوزّع شبكة أساسية على عدة شبكات فرعية بأحجام مختلفة حسب عدد الـ Hosts المطلوب لكل واحدة،
// بأصغر هدر ممكن للعناوين (كل شبكة فرعية تاخذ أصغر حجم يكفيها بالضبط).
// ============================================

import { ipToInt, intToIp, isValidIp } from './subnet-logic.js';

// يحسب أصغر CIDR (أكبر Prefix) يكفي لعدد Hosts معين
// مثال: 50 host تحتاج على الأقل 2^6 - 2 = 62 عنوان صالح => /26
export function findSmallestPrefixForHosts(requiredHosts) {
    for (let hostBits = 0; hostBits <= 30; hostBits++) {
        const totalAddresses = Math.pow(2, hostBits);
        const usableHosts = hostBits <= 1 ? totalAddresses : totalAddresses - 2;
        if (usableHosts >= requiredHosts) {
            return 32 - hostBits;
        }
    }
    return 0; // نطاق ضخم جداً (كل شبكة الـ IPv4)
}

// الدالة الرئيسية: توزّع الشبكة الأساسية على الطلبات بالترتيب (الأكبر أولاً)
// baseIp/baseCidr: الشبكة الأصلية المتاحة للتوزيع (مثال: 192.168.1.0/24)
// requirements: [{ name: 'Sales', hosts: 50 }, { name: 'IT', hosts: 20 }, ...]
export function calculateVLSM(baseIp, baseCidr, requirements) {
    if (!isValidIp(baseIp)) {
        throw new Error('عنوان الشبكة الأساسية غير صحيح.');
    }
    if (!requirements || requirements.length === 0) {
        throw new Error('لازم تضيف على الأقل شبكة فرعية واحدة.');
    }

    // رتّب الطلبات تنازلياً حسب عدد الـ Hosts (الأكبر ياخذ مكانه أولاً، هذا أساس خوارزمية VLSM)
    const sorted = [...requirements]
        .map((r, originalIndex) => ({ ...r, originalIndex }))
        .sort((a, b) => b.hosts - a.hosts);

    const baseMaskInt = baseCidr === 0 ? 0 : (0xFFFFFFFF << (32 - baseCidr)) >>> 0;
    const baseNetworkInt = (ipToInt(baseIp) & baseMaskInt) >>> 0; // >>> 0 ضروري هون عشان JS بترجع رقم سالب من & لو أعلى بت مفعّل
    const baseTotalAddresses = Math.pow(2, 32 - baseCidr);
    const baseEndInt = baseNetworkInt + baseTotalAddresses - 1;

    let currentPointer = baseNetworkInt;
    const allocations = [];

    for (const req of sorted) {
        const prefix = findSmallestPrefixForHosts(req.hosts);
        const blockSize = Math.pow(2, 32 - prefix);

        // محاذاة العنوان (Alignment): كل شبكة فرعية لازم تبدأ على حد مضاعف لحجمها
        const aligned = Math.ceil(currentPointer / blockSize) * blockSize;
        const networkInt = aligned;
        const broadcastInt = networkInt + blockSize - 1;

        if (broadcastInt > baseEndInt) {
            throw new Error(
                `لا توجد مساحة كافية بالشبكة الأساسية لتلبية طلب "${req.name}" (يحتاج ${req.hosts} host). قلّل عدد الشبكات الفرعية أو استخدم شبكة أساسية أكبر.`
            );
        }

        const usableHosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : blockSize - 2;
        const firstHost = prefix >= 31 ? intToIp(networkInt) : intToIp(networkInt + 1);
        const lastHost = prefix >= 31 ? intToIp(broadcastInt) : intToIp(broadcastInt - 1);

        allocations.push({
            originalIndex: req.originalIndex,
            name: req.name,
            requestedHosts: req.hosts,
            prefix,
            subnetMask: intToIp(prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0),
            networkAddress: intToIp(networkInt),
            broadcastAddress: intToIp(broadcastInt),
            firstHost,
            lastHost,
            usableHosts,
            totalAddresses: blockSize
        });

        currentPointer = broadcastInt + 1;
    }

    // رجّع النتائج بنفس ترتيب إدخال المستخدم الأصلي (مو الترتيب التنازلي الداخلي)
    return allocations.sort((a, b) => a.originalIndex - b.originalIndex);
}
