import { COMMANDS, fakePing, fakeTraceroute, fakeIfconfig, fakeNetstat } from '../logic/terminal-logic.js';

describe('fakePing', () => {
    test('بدون هدف يرجع رسالة استخدام', () => {
        expect(fakePing(undefined)).toBe('الاستخدام: ping <address>');
    });

    test('مع هدف يرجع مخرجات فيها اسم الهدف و4 حزم', () => {
        const output = fakePing('8.8.8.8');
        expect(output).toContain('PING 8.8.8.8');
        expect(output).toContain('4 packets transmitted, 4 received, 0% packet loss');
        expect((output.match(/icmp_seq/g) || []).length).toBe(4);
    });
});

describe('fakeTraceroute', () => {
    test('بدون هدف يرجع رسالة استخدام', () => {
        expect(fakeTraceroute(undefined)).toBe('الاستخدام: traceroute <address>');
    });

    test('مع هدف يرجع سطر ترويسة + 5 قفزات (hops) وينتهي بالهدف', () => {
        const output = fakeTraceroute('example.com');
        const lines = output.split('\n');
        expect(lines).toHaveLength(6); // سطر الترويسة + 5 hops
        expect(lines[lines.length - 1]).toContain('example.com');
    });
});

describe('fakeIfconfig / fakeNetstat (مخرجات ثابتة)', () => {
    test('fakeIfconfig يحتوي على واجهة eth0', () => {
        expect(fakeIfconfig()).toContain('eth0');
    });

    test('fakeNetstat يحتوي على عنوان الترويسة', () => {
        expect(fakeNetstat()).toContain('Active Internet connections');
    });
});

describe('COMMANDS (خريطة الأوامر)', () => {
    test('whoami يرجع اسم المستخدم المتوقع', () => {
        expect(COMMANDS.whoami()).toBe('user@netxpert');
    });

    test('clear يرجع إشارة المسح الخاصة', () => {
        expect(COMMANDS.clear()).toBe('__CLEAR__');
    });

    test('help يحتوي على وصف كل الأوامر المتاحة', () => {
        const helpText = COMMANDS.help();
        expect(helpText).toContain('ping');
        expect(helpText).toContain('traceroute');
        expect(helpText).toContain('netstat');
    });

    test('أمر ping غير موجود بالخريطة كنص خام، بل عبر handler بيمرر args', () => {
        expect(COMMANDS.ping(['1.1.1.1'])).toContain('PING 1.1.1.1');
    });
});
