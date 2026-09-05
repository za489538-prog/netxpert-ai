// ============================================
// NetXpert AI - منطق مقارنة عناوين IP (Pure Logic)
// بدون أي تعامل مع DOM، قابل للاختبار مباشرة بـ Jest
// ============================================

import { ipToInt, intToIp, isValidIp } from './subnet-logic.js';

// يحول IP لأربع مجموعات ثنائية (كل وحدة 8 بت)، مثال: ['11000000','10101000','00000001','00001010']
export function ipToBinaryOctets(ip) {
    const int = ipToInt(ip);
    const fullBinary = int.toString(2).padStart(32, '0');
    return [
        fullBinary.slice(0, 8),
        fullBinary.slice(8, 16),
        fullBinary.slice(16, 24),
        fullBinary.slice(24, 32)
    ];
}

// عدد البتات المشتركة من بداية العنوان (Common Prefix Length) بين عنوانين
export function commonPrefixLength(ip1, ip2) {
    const xorInt = (ipToInt(ip1) ^ ipToInt(ip2)) >>> 0;
    if (xorInt === 0) return 32;

    for (let bit = 31; bit >= 0; bit--) {
        if ((xorInt >>> bit) & 1) {
            return 31 - bit;
        }
    }
    return 32;
}

// مقارنة رقمية بسيطة: أي عنوان أكبر كرقم صحيح 32-bit
export function compareIpValues(ip1, ip2) {
    const a = ipToInt(ip1);
    const b = ipToInt(ip2);
    if (a === b) return 'equal';
    return a > b ? 'first' : 'second';
}

// هل العنوانين بنفس الشبكة تحت نفس الـ CIDR المشترك؟
export function isSameNetwork(ip1, ip2, cidr) {
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
        throw new Error('CIDR يجب أن يكون بين 0 و 32');
    }
    const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const net1 = (ipToInt(ip1) & maskInt) >>> 0;
    const net2 = (ipToInt(ip2) & maskInt) >>> 0;
    return net1 === net2;
}

// الدالة الرئيسية: مقارنة شاملة بين عنوانين، مع Binary وعدد البتات المشتركة
// cidr اختياري - لو انعطى، بترجع أيضاً هل العنوانين بنفس الشبكة تحته
export function compareIPAddresses(ip1, ip2, cidr = null) {
    if (!isValidIp(ip1)) throw new Error(`عنوان IP الأول غير صحيح: "${ip1}"`);
    if (!isValidIp(ip2)) throw new Error(`عنوان IP الثاني غير صحيح: "${ip2}"`);

    const int1 = ipToInt(ip1);
    const int2 = ipToInt(ip2);

    const binary1 = ipToBinaryOctets(ip1).join('');
    const binary2 = ipToBinaryOctets(ip2).join('');

    // مصفوفة من 32 قيمة: true لو البت مختلف بين العنوانين، لتلوينها بالواجهة
    const bitDiff = Array.from({ length: 32 }, (_, i) => binary1[i] !== binary2[i]);

    const prefixLen = commonPrefixLength(ip1, ip2);
    const commonNetworkMaskInt = prefixLen === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLen)) >>> 0;
    const commonNetworkInt = (int1 & commonNetworkMaskInt) >>> 0;

    const result = {
        ip1,
        ip2,
        areEqual: int1 === int2,
        largerAddress: int1 === int2 ? null : (int1 > int2 ? ip1 : ip2),
        binary1: ipToBinaryOctets(ip1),
        binary2: ipToBinaryOctets(ip2),
        bitDiff,
        commonPrefixLength: prefixLen,
        smallestCommonNetwork: {
            address: intToIp(commonNetworkInt),
            cidr: prefixLen
        }
    };

    if (cidr !== null) {
        result.cidr = cidr;
        result.sameNetwork = isSameNetwork(ip1, ip2, cidr);
    }

    return result;
}
