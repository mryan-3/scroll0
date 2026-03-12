export function validateDomain(input) {
    let domain = input.trim().toLowerCase();
    if (!domain) return null;
    try {
        if (domain.startsWith('http')) {
            domain = new URL(domain).hostname;
        }
        return domain.replace(/^www\./, '');
    } catch (e) {
        return null;
    }
}

export function saveList(blocklist) {
    return new Promise(resolve => chrome.storage.local.set({ blocklist }, resolve));
}

export function getList() {
    return new Promise(resolve => {
        chrome.storage.local.get(['blocklist'], res => resolve(res.blocklist || []));
    });
}
