export function getStorage(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

export function setStorage(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}

export function cleanupAllowlist(allowlist) {
    const now = Date.now();
    let changed = false;
    const cleaned = { ...allowlist };

    for (const [domain, expiry] of Object.entries(cleaned)) {
        if (now > expiry) {
            delete cleaned[domain];
            chrome.alarms.clear(domain);
            changed = true;
        }
    }

    return { cleaned, changed };
}

export function isUrlBlocked(urlStr, blocklist, allowlist) {
    try {
        const url = new URL(urlStr);
        if (url.protocol === 'chrome-extension:') return false;

        const host = url.hostname.toLowerCase();
        const isMatched = blocklist.some(d => host === d || host.endsWith('.' + d));
        if (!isMatched) return false;

        const now = Date.now();
        for (const [allowedDomain, expiry] of Object.entries(allowlist)) {
            if ((host === allowedDomain || host.endsWith('.' + allowedDomain)) && now < expiry) {
                return false;
            }
        }

        return true;
    } catch (e) {
        return false;
    }
}
