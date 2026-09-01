// ============================================
// NetXpert AI - منطق حاسبة الـ Subnetting (Pure Logic)
// ما فيه أي تعامل مع DOM هون، عشان يصير قابل للاختبار
// مباشرة بـ Jest وقابل لإعادة الاستخدام بأي مكان بالمشروع.
// ============================================

export function ipToInt(ip) {
    const parts = ip.split('.').map(Number);
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(int) {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
}

export function isValidIp(ip) {
    const regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(regex);
    if (!match) return false;
    return match.slice(1).every(octet => Number(octet) >= 0 && Number(octet) <= 255);
}

export function getIpClassAndType(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet === 127) return 'Loopback';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    return 'E (Experimental)';
}

export function isPrivateIp(parts) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
}

export function calculateSubnet(ip, cidr) {
    const ipInt = ipToInt(ip);
    const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
    const totalHosts = Math.pow(2, 32 - cidr);

    let firstHost, lastHost, usableHosts;
    if (cidr >= 31) {
        firstHost = intToIp(networkInt);
        lastHost = intToIp(broadcastInt);
        usableHosts = cidr === 32 ? 1 : 2;
    } else {
        firstHost = intToIp(networkInt + 1);
        lastHost = intToIp(broadcastInt - 1);
        usableHosts = totalHosts - 2;
    }

    const parts = ip.split('.').map(Number);

    return {
        ip, cidr,
        subnetMask: intToIp(maskInt),
        networkAddress: intToIp(networkInt),
        broadcastAddress: intToIp(broadcastInt),
        firstHost, lastHost, totalHosts, usableHosts,
        ipClass: getIpClassAndType(parts[0]),
        isPrivate: isPrivateIp(parts)
    };
}
