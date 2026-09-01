// ============================================
// NetXpert AI - منطق حسابات IPv6 (Pure Logic)
// يستخدم BigInt للتعامل مع أرقام 128-bit، وقابل للاختبار مباشرة بـ Jest
// ============================================

export function isIPv6(ip) {
    return ip.includes(':');
}

export function isValidIPv6(ip) {
    if (!ip.includes(':')) return false;

    const doubleColonCount = (ip.match(/::/g) || []).length;
    if (doubleColonCount > 1) return false;

    const hasDoubleColon = doubleColonCount === 1;
    const parts = ip.split('::');
    const head = parts[0] ? parts[0].split(':') : [];
    const tail = hasDoubleColon && parts[1] ? parts[1].split(':') : [];
    const allGroups = hasDoubleColon ? [...head, ...tail] : ip.split(':');

    if (!hasDoubleColon && allGroups.length !== 8) return false;
    if (hasDoubleColon && allGroups.length >= 8) return false;

    const hexRegex = /^[0-9a-fA-F]{1,4}$/;
    return allGroups.every(g => hexRegex.test(g));
}

function expandIPv6(ip) {
    const [head, tail] = ip.split('::');
    const headParts = head ? head.split(':') : [];
    const tailParts = tail ? tail.split(':') : [];
    const missing = 8 - headParts.length - tailParts.length;
    const middle = new Array(missing).fill('0');
    return [...headParts, ...middle, ...tailParts].map(p => p.padStart(4, '0'));
}

export function ipv6ToBigInt(ip) {
    const parts = ip.includes('::')
        ? expandIPv6(ip)
        : ip.split(':').map(p => p.padStart(4, '0'));
    return parts.reduce((acc, part) => (acc << 16n) + BigInt(parseInt(part, 16)), 0n);
}

export function bigIntToIPv6(num) {
    const hex = num.toString(16).padStart(32, '0');
    const groups = hex.match(/.{1,4}/g).map(g => parseInt(g, 16).toString(16));

    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    groups.forEach((g, i) => {
        if (g === '0') {
            if (curStart === -1) curStart = i;
            curLen++;
            if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
        } else {
            curStart = -1; curLen = 0;
        }
    });

    if (bestLen > 1) {
        const before = groups.slice(0, bestStart);
        const after = groups.slice(bestStart + bestLen);
        return `${before.join(':')}::${after.join(':')}`;
    }
    return groups.join(':');
}

function isInRange(bigIntValue, prefixIp, prefixLen) {
    const prefixBig = ipv6ToBigInt(prefixIp);
    const hostBits = 128n - BigInt(prefixLen);
    const mask = prefixLen === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << hostBits) - 1n);
    return (bigIntValue & mask) === (prefixBig & mask);
}

export function getIPv6AddressType(bigIntValue) {
    if (bigIntValue === 0n) return 'Unspecified (::)';
    if (bigIntValue === 1n) return 'Loopback (::1)';
    if (isInRange(bigIntValue, 'fe80::', 10)) return 'Link-Local Unicast';
    if (isInRange(bigIntValue, 'fc00::', 7)) return 'Unique Local (ULA)';
    if (isInRange(bigIntValue, 'ff00::', 8)) return 'Multicast';
    if (isInRange(bigIntValue, '2001:db8::', 32)) return 'Documentation (2001:db8::/32)';
    if (isInRange(bigIntValue, '2000::', 3)) return 'Global Unicast';
    return 'غير مصنّف (Reserved/Other)';
}

export function calculateIPv6Subnet(ip, prefix) {
    const ipBig = ipv6ToBigInt(ip);
    const hostBits = 128n - BigInt(prefix);
    const mask = prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << hostBits) - 1n);

    const networkBig = ipBig & mask;
    const lastAddressBig = networkBig | ((1n << hostBits) - 1n);
    const totalAddresses = 2n ** hostBits;

    return {
        ip,
        prefix,
        version: 'IPv6',
        networkAddress: bigIntToIPv6(networkBig),
        lastAddress: bigIntToIPv6(lastAddressBig),
        firstUsable: bigIntToIPv6(networkBig),
        totalAddresses: totalAddresses.toLocaleString('en-US'),
        addressType: getIPv6AddressType(ipBig)
    };
}
