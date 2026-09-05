import {
    ipToBinaryOctets,
    commonPrefixLength,
    compareIpValues,
    isSameNetwork,
    compareIPAddresses
} from '../logic/ip-compare-logic.js';

describe('ipToBinaryOctets', () => {
    test('يحول عنوان عادي لأربع مجموعات ثنائية', () => {
        expect(ipToBinaryOctets('192.168.1.10')).toEqual(
            ['11000000', '10101000', '00000001', '00001010']
        );
    });

    test('0.0.0.0 كله أصفار', () => {
        expect(ipToBinaryOctets('0.0.0.0')).toEqual(
            ['00000000', '00000000', '00000000', '00000000']
        );
    });

    test('255.255.255.255 كله واحدات', () => {
        expect(ipToBinaryOctets('255.255.255.255')).toEqual(
            ['11111111', '11111111', '11111111', '11111111']
        );
    });
});

describe('commonPrefixLength', () => {
    test('عنوانين متطابقين = 32', () => {
        expect(commonPrefixLength('192.168.1.10', '192.168.1.10')).toBe(32);
    });

    test('نفس الـ /24 بمضيف مختلف = 24', () => {
        expect(commonPrefixLength('192.168.1.10', '192.168.1.200')).toBe(24);
    });

    test('عنوانين مختلفين تماماً من أول بت = 0', () => {
        expect(commonPrefixLength('0.0.0.0', '255.255.255.255')).toBe(0);
    });

    test('اختلاف بأول بت فقط = 0', () => {
        expect(commonPrefixLength('0.0.0.0', '128.0.0.0')).toBe(0);
    });

    test('اختلاف بآخر بت فقط = 31', () => {
        expect(commonPrefixLength('192.168.1.10', '192.168.1.11')).toBe(31);
    });
});

describe('compareIpValues', () => {
    test('عنوانين متساويين', () => {
        expect(compareIpValues('1.1.1.1', '1.1.1.1')).toBe('equal');
    });

    test('العنوان الأول أكبر', () => {
        expect(compareIpValues('192.168.1.10', '10.0.0.1')).toBe('first');
    });

    test('العنوان الثاني أكبر', () => {
        expect(compareIpValues('10.0.0.1', '192.168.1.10')).toBe('second');
    });
});

describe('isSameNetwork', () => {
    test('نفس الشبكة تحت /24', () => {
        expect(isSameNetwork('192.168.1.10', '192.168.1.200', 24)).toBe(true);
    });

    test('شبكات مختلفة تحت /24', () => {
        expect(isSameNetwork('192.168.1.10', '192.168.2.10', 24)).toBe(false);
    });

    test('يرمي خطأ لو الـ CIDR خارج المدى المسموح', () => {
        expect(() => isSameNetwork('1.1.1.1', '1.1.1.2', 33)).toThrow();
    });
});

describe('compareIPAddresses (الدالة الشاملة)', () => {
    test('مقارنة كاملة بين عنوانين بنفس الشبكة /24', () => {
        const r = compareIPAddresses('192.168.1.10', '192.168.1.200', 24);
        expect(r.areEqual).toBe(false);
        expect(r.largerAddress).toBe('192.168.1.200');
        expect(r.commonPrefixLength).toBe(24);
        expect(r.smallestCommonNetwork).toEqual({ address: '192.168.1.0', cidr: 24 });
        expect(r.sameNetwork).toBe(true);
        expect(r.bitDiff.filter(Boolean)).toHaveLength(3); // فقط البتات الفعلية المختلفة
    });

    test('بدون تمرير CIDR، ما ترجع sameNetwork', () => {
        const r = compareIPAddresses('10.0.0.1', '10.0.0.2');
        expect(r).not.toHaveProperty('sameNetwork');
        expect(r).not.toHaveProperty('cidr');
    });

    test('عنوانين متطابقين', () => {
        const r = compareIPAddresses('1.1.1.1', '1.1.1.1');
        expect(r.areEqual).toBe(true);
        expect(r.largerAddress).toBeNull();
        expect(r.commonPrefixLength).toBe(32);
        expect(r.bitDiff.every(b => b === false)).toBe(true);
    });

    test('يرمي خطأ لو العنوان الأول غير صحيح', () => {
        expect(() => compareIPAddresses('999.1.1.1', '1.1.1.1')).toThrow();
    });

    test('يرمي خطأ لو العنوان الثاني غير صحيح', () => {
        expect(() => compareIPAddresses('1.1.1.1', 'abc')).toThrow();
    });
});
