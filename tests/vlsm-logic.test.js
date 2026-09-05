import { findSmallestPrefixForHosts, calculateVLSM } from '../logic/vlsm-logic.js';

describe('findSmallestPrefixForHosts', () => {
    test('50 hosts تحتاج /26 (62 usable)', () => {
        expect(findSmallestPrefixForHosts(50)).toBe(26);
    });

    test('20 hosts تحتاج /27 (30 usable)', () => {
        expect(findSmallestPrefixForHosts(20)).toBe(27);
    });

    test('10 hosts تحتاج /28 (14 usable)', () => {
        expect(findSmallestPrefixForHosts(10)).toBe(28);
    });

    test('2 hosts (شبكة Link) تحتاج /31', () => {
        expect(findSmallestPrefixForHosts(2)).toBe(31);
    });

    test('1 host تحتاج /32', () => {
        expect(findSmallestPrefixForHosts(1)).toBe(32);
    });
});

describe('calculateVLSM (المثال الكلاسيكي بمناهج الشبكات: Sales/IT/HR/Link)', () => {
    const requirements = [
        { name: 'Sales', hosts: 50 },
        { name: 'IT', hosts: 20 },
        { name: 'HR', hosts: 10 },
        { name: 'Link', hosts: 2 }
    ];
    const result = calculateVLSM('192.168.1.0', 24, requirements);

    test('يوزّع 4 شبكات فرعية بنفس عدد الطلبات', () => {
        expect(result).toHaveLength(4);
    });

    test('Sales (50 host) تاخذ /26 تبدأ من 192.168.1.0', () => {
        const sales = result.find(r => r.name === 'Sales');
        expect(sales.prefix).toBe(26);
        expect(sales.networkAddress).toBe('192.168.1.0');
        expect(sales.broadcastAddress).toBe('192.168.1.63');
        expect(sales.usableHosts).toBe(62);
    });

    test('IT (20 host) تاخذ /27 وتبدأ فوراً بعد Sales', () => {
        const it = result.find(r => r.name === 'IT');
        expect(it.prefix).toBe(27);
        expect(it.networkAddress).toBe('192.168.1.64');
        expect(it.broadcastAddress).toBe('192.168.1.95');
    });

    test('HR (10 host) تاخذ /28', () => {
        const hr = result.find(r => r.name === 'HR');
        expect(hr.prefix).toBe(28);
        expect(hr.networkAddress).toBe('192.168.1.96');
        expect(hr.broadcastAddress).toBe('192.168.1.111');
    });

    test('Link (2 host) تاخذ /31 وما فيها Network/Broadcast منفصلين', () => {
        const link = result.find(r => r.name === 'Link');
        expect(link.prefix).toBe(31);
        expect(link.networkAddress).toBe('192.168.1.112');
        expect(link.usableHosts).toBe(2);
    });

    test('النتيجة ترجع بنفس ترتيب إدخال المستخدم الأصلي، مو الترتيب الداخلي التنازلي', () => {
        expect(result.map(r => r.name)).toEqual(['Sales', 'IT', 'HR', 'Link']);
    });
});

describe('calculateVLSM - معالجة الأخطاء', () => {
    test('يرفض إذا الشبكة الأساسية IP غير صحيح', () => {
        expect(() => calculateVLSM('999.1.1.1', 24, [{ name: 'A', hosts: 5 }])).toThrow();
    });

    test('يرفض قائمة فاضية من المتطلبات', () => {
        expect(() => calculateVLSM('192.168.1.0', 24, [])).toThrow();
    });

    test('يرفض لو الطلبات أكبر من مساحة الشبكة الأساسية المتاحة', () => {
        expect(() => calculateVLSM('192.168.1.0', 28, [{ name: 'Big', hosts: 500 }])).toThrow();
    });
});

describe('calculateVLSM - اختبار الارتداد (Regression) لباغ الأرقام السالبة', () => {
    // هذا الاختبار موجود عشان نتأكد إن باغ عمليات البت (&) اللي بترجع رقم سالب
    // لعناوين أول بايت فيها ≥ 128 (زي 192.x.x.x) ما يرجع تاني أبداً.
    test('192.168.1.0/28 (أعلى بت مفعّل) يعطي baseNetworkInt صحيح موجب', () => {
        const result = calculateVLSM('192.168.1.0', 28, [{ name: 'Small', hosts: 5 }]);
        expect(result[0].networkAddress).toBe('192.168.1.0');
        expect(result[0].broadcastAddress).toBe('192.168.1.7');
    });

    test('10.0.0.0/8 (أول بايت صغير) يشتغل صح كمان', () => {
        const result = calculateVLSM('10.0.0.0', 8, [{ name: 'Huge', hosts: 1000000 }]);
        expect(result[0].networkAddress).toBe('10.0.0.0');
        expect(result[0].prefix).toBe(12);
    });
});
