import {
    ipToInt,
    intToIp,
    isValidIp,
    getIpClassAndType,
    isPrivateIp,
    calculateSubnet
} from '../logic/subnet-logic.js';

describe('isValidIp', () => {
    test('يقبل عنوان IP صحيح', () => {
        expect(isValidIp('192.168.1.1')).toBe(true);
    });

    test('يرفض عنوان بأوكتيت أكبر من 255', () => {
        expect(isValidIp('192.168.1.999')).toBe(false);
    });

    test('يرفض عنوان ناقص الأجزاء', () => {
        expect(isValidIp('192.168.1')).toBe(false);
    });

    test('يرفض نص غير رقمي بالكامل', () => {
        expect(isValidIp('hello.world.test.ip')).toBe(false);
    });
});

describe('ipToInt / intToIp (تحويل ذهاب وإياب)', () => {
    test('يحول IP لرقم صحيح ويرجعه لنفس الـ IP', () => {
        const ip = '192.168.1.10';
        expect(intToIp(ipToInt(ip))).toBe(ip);
    });

    test('يحول 0.0.0.0 بشكل صحيح', () => {
        expect(ipToInt('0.0.0.0')).toBe(0);
    });

    test('يحول 255.255.255.255 بشكل صحيح', () => {
        expect(ipToInt('255.255.255.255')).toBe(4294967295);
    });
});

describe('getIpClassAndType (تصنيف عنوان الـ IP)', () => {
    test.each([
        [10, 'A'],
        [126, 'A'],
        [127, 'Loopback'],
        [128, 'B'],
        [191, 'B'],
        [192, 'C'],
        [223, 'C'],
        [230, 'D (Multicast)'],
        [250, 'E (Experimental)']
    ])('الأوكتيت الأول %i يعطي الفئة %s', (octet, expected) => {
        expect(getIpClassAndType(octet)).toBe(expected);
    });
});

describe('isPrivateIp (عناوين خاصة مقابل عامة)', () => {
    test('10.x.x.x عنوان خاص', () => {
        expect(isPrivateIp([10, 0, 0, 5])).toBe(true);
    });

    test('172.16-31.x.x عنوان خاص', () => {
        expect(isPrivateIp([172, 20, 5, 5])).toBe(true);
    });

    test('172.32.x.x (خارج المدى) عنوان عام', () => {
        expect(isPrivateIp([172, 32, 5, 5])).toBe(false);
    });

    test('192.168.x.x عنوان خاص', () => {
        expect(isPrivateIp([192, 168, 1, 1])).toBe(true);
    });

    test('8.8.8.8 عنوان عام (Google DNS)', () => {
        expect(isPrivateIp([8, 8, 8, 8])).toBe(false);
    });
});

describe('calculateSubnet (الحساب الكامل)', () => {
    test('192.168.1.10/24 يعطي شبكة وبرودكاست صحيحين', () => {
        const result = calculateSubnet('192.168.1.10', 24);
        expect(result.networkAddress).toBe('192.168.1.0');
        expect(result.broadcastAddress).toBe('192.168.1.255');
        expect(result.subnetMask).toBe('255.255.255.0');
        expect(result.firstHost).toBe('192.168.1.1');
        expect(result.lastHost).toBe('192.168.1.254');
        expect(result.usableHosts).toBe(254);
        expect(result.isPrivate).toBe(true);
    });

    test('10.20.30.40/16 يحسب شبكة صحيحة على حدود غير معتادة', () => {
        const result = calculateSubnet('10.20.30.40', 16);
        expect(result.networkAddress).toBe('10.20.0.0');
        expect(result.broadcastAddress).toBe('10.20.255.255');
        expect(result.usableHosts).toBe(65534);
    });

    test('/30 (شبكة نقطة لنقطة) عندها مضيفين قابلين للاستخدام فقط', () => {
        const result = calculateSubnet('192.168.1.4', 30);
        expect(result.networkAddress).toBe('192.168.1.4');
        expect(result.broadcastAddress).toBe('192.168.1.7');
        expect(result.usableHosts).toBe(2);
    });

    test('/31 حالة خاصة: عنوانين فقط بدون شبكة/برودكاست منفصلين', () => {
        const result = calculateSubnet('192.168.1.0', 31);
        expect(result.usableHosts).toBe(2);
        expect(result.firstHost).toBe('192.168.1.0');
        expect(result.lastHost).toBe('192.168.1.1');
    });

    test('/32 حالة خاصة: مضيف واحد فقط', () => {
        const result = calculateSubnet('192.168.1.55', 32);
        expect(result.usableHosts).toBe(1);
        expect(result.firstHost).toBe('192.168.1.55');
        expect(result.lastHost).toBe('192.168.1.55');
    });

    test('/0 يغطي كل مساحة عناوين IPv4', () => {
        const result = calculateSubnet('10.0.0.1', 0);
        expect(result.subnetMask).toBe('0.0.0.0');
        expect(result.networkAddress).toBe('0.0.0.0');
        expect(result.broadcastAddress).toBe('255.255.255.255');
    });
});
