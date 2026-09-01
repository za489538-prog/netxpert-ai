// ============================================
// NetXpert AI - منطق فلترة الحزم (Pure Logic)
// نفس شرط الفلترة المستخدم بمحلل الحزم، بدون أي DOM
// ============================================

export function filterPackets(packets, filterText) {
    if (!filterText || !filterText.trim()) {
        return packets;
    }
    const query = filterText.trim().toLowerCase();
    return packets.filter(p =>
        p.protocol.toLowerCase().includes(query) ||
        p.source.includes(query) ||
        p.destination.includes(query) ||
        p.info.toLowerCase().includes(query)
    );
}
