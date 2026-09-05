import {
    isIPv6,
    isValidIPv6,
    ipv6ToBigInt,
    bigIntToIPv6,
    getIPv6AddressType,
    calculateIPv6Subnet
} from '../logic/ipv6-logic.js';

describe('isIPv6 (اكتشاف نوع العنوان)', () => {
    test('يتعرف على عنوان IPv6 بوجود :', () => {
        expect(isIPv6('2001:db8::1')).toBe(true);
    });

    test('لا يعتبر عنوان IPv4 عنوان IPv6', () => {
        expect(isIPv6('192.168.1.1')).toBe(false);
    });
});

describe('isValidIPv6 (التحقق من الصيغة)', () => {
    test('يقبل عنوان مضغوط صحيح', () => {
        expect(isValidIPv6('2001:db8::1')).toBe(true);
    });

    test('يقبل عنوان كامل بدون ضغط', () => {
        expect(isValidIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true);
    });

    test('يرفض وجود :: أكثر من مرة', () => {
        expect(isValidIPv6('2001::db8::1')).toBe(false);
    });

    test('يرفض حروف غير سداسية عشرية', () => {
        expect(isValidIPv6('zzzz::1')).toBe(false);
    });

    test('يرفض عنوان IPv4', () => {
        expect(isValidIPv6('192.168.1.1')).toBe(false);
    });
});

describe('ipv6ToBigInt / bigIntToIPv6 (تحويل ذهاب وإياب)', () => {
    test('يحول عنوان مضغوط ويرجعه لنفس الشكل المضغوط', () => {
        const ip = '2001:db8::1';
        expect(bigIntToIPv6(ipv6ToBigInt(ip))).toBe(ip);
    });

    test(':: (كل الأصفار) يعطي BigInt يساوي صفر', () => {
        expect(ipv6ToBigInt('::')).toBe(0n);
    });

    test('::1 (Loopback) يعطي BigInt يساوي واحد', () => {
        expect(ipv6ToBigInt('::1')).toBe(1n);
    });
});

describe('getIPv6AddressType (تصنيف نوع العنوان حسب RFC 4291)', () => {
    test('::1 هو Loopback', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('::1'))).toBe('Loopback (::1)');
    });

    test(':: هو Unspecified', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('::'))).toBe('Unspecified (::)');
    });

    test('fe80::1 هو Link-Local', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('fe80::1'))).toBe('Link-Local Unicast');
    });

    test('fc00::1 هو Unique Local', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('fc00::1'))).toBe('Unique Local (ULA)');
    });

    test('ff02::1 هو Multicast', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('ff02::1'))).toBe('Multicast');
    });

    test('2001:db8::1 هو عنوان توثيقي (Documentation)', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('2001:db8::1'))).toBe('Documentation (2001:db8::/32)');
    });

    test('2606:4700:4700::1111 (Cloudflare DNS الحقيقي) هو Global Unicast', () => {
        expect(getIPv6AddressType(ipv6ToBigInt('2606:4700:4700::1111'))).toBe('Global Unicast');
    });
});

describe('calculateIPv6Subnet (الحساب الكامل)', () => {
    test('2001:db8::1/64 يحسب الشبكة وآخر عنوان بشكل صحيح', () => {
        const result = calculateIPv6Subnet('2001:db8::1', 64);
        expect(result.networkAddress).toBe('2001:db8::');
        expect(result.lastAddress).toBe('2001:db8::ffff:ffff:ffff:ffff');
        expect(result.totalAddresses).toBe('18,446,744,073,709,551,616');
    });

    test('fe80::abcd/10 يصنَّف Link-Local ويحسب شبكة صحيحة', () => {
        const result = calculateIPv6Subnet('fe80::abcd', 10);
        expect(result.networkAddress).toBe('fe80::');
        expect(result.addressType).toBe('Link-Local Unicast');
    });

    test('/128 (مضيف واحد فقط) الشبكة = آخر عنوان = العنوان نفسه', () => {
        const result = calculateIPv6Subnet('2001:db8::1', 128);
        expect(result.networkAddress).toBe('2001:db8::1');
        expect(result.lastAddress).toBe('2001:db8::1');
        expect(result.totalAddresses).toBe('1');
    });

    test('/0 يغطي كل مساحة عناوين IPv6', () => {
        const result = calculateIPv6Subnet('2001:db8::1', 0);
        expect(result.networkAddress).toBe('::');
        expect(result.lastAddress).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    });
});
