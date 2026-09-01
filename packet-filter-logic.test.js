import { filterPackets } from '../logic/packet-filter-logic.js';

const samplePackets = [
    { no: 1, source: '192.168.1.1', destination: '8.8.8.8', protocol: 'DNS', info: 'Standard query A example.com' },
    { no: 2, source: '10.0.0.5', destination: '1.1.1.1', protocol: 'TCP', info: 'SYN' },
    { no: 3, source: '192.168.1.10', destination: '192.168.1.1', protocol: 'ARP', info: 'Who has 192.168.1.1? Tell 192.168.1.10' }
];

describe('filterPackets', () => {
    test('فلتر فاضي يرجع كل الحزم بدون تغيير', () => {
        expect(filterPackets(samplePackets, '')).toEqual(samplePackets);
    });

    test('فلتر بروتوكول (case-insensitive) يرجع الحزم المطابقة فقط', () => {
        const result = filterPackets(samplePackets, 'dns');
        expect(result).toHaveLength(1);
        expect(result[0].protocol).toBe('DNS');
    });

    test('فلتر عنوان IP يرجع الحزم اللي مصدرها أو وجهتها تطابق', () => {
        const result = filterPackets(samplePackets, '8.8.8.8');
        expect(result).toHaveLength(1);
        expect(result[0].no).toBe(1);
    });

    test('فلتر نص من محتوى info يرجع الحزمة المطابقة', () => {
        const result = filterPackets(samplePackets, 'Who has');
        expect(result).toHaveLength(1);
        expect(result[0].protocol).toBe('ARP');
    });

    test('فلتر بدون أي تطابق يرجع مصفوفة فاضية', () => {
        expect(filterPackets(samplePackets, 'nonexistent')).toEqual([]);
    });
});
