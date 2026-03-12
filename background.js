import { getStorage, setStorage, cleanupAllowlist, isUrlBlocked } from './background-utils.js';

let blocklist = [];
let allowlist = {};

// Initial load
async function init() {
    const res = await getStorage(['blocklist', 'allowlist']);
    blocklist = res.blocklist || ['twitter.com', 'x.com', 'instagram.com', 'reddit.com'];
    allowlist = res.allowlist || {};
    if (!res.blocklist) await setStorage({ blocklist });

    // Create periodic cleanup alarm (replaces unreliable setInterval)
    chrome.alarms.create('SYSTEM_CLEANUP', { periodInMinutes: 1 });

    const { cleaned, changed } = cleanupAllowlist(allowlist);
    if (changed) {
        allowlist = cleaned;
        await setStorage({ allowlist });
    }
}

init();

chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local') {
        if (changes.blocklist) blocklist = changes.blocklist.newValue || [];
        if (changes.allowlist) allowlist = changes.allowlist.newValue || {};
    }
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
    if (details.frameId === 0 && isUrlBlocked(details.url, blocklist, allowlist)) {
        const blockUrl = chrome.runtime.getURL(`block.html?target=${encodeURIComponent(details.url)}`);
        chrome.tabs.update(details.tabId, { url: blockUrl });
    }
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'allowSite') {
        const domain = new URL(req.targetUrl).hostname.replace(/^www\./, '');
        const durationMin = req.durationMinutes || 15;
        allowlist[domain] = Date.now() + (durationMin * 60 * 1000);
        setStorage({ allowlist }).then(() => {
            chrome.alarms.create(domain, { delayInMinutes: durationMin });
            sendResponse({ success: true });
        });
        return true;
    }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'SYSTEM_CLEANUP') {
        const { cleaned, changed } = cleanupAllowlist(allowlist);
        if (changed) {
            allowlist = cleaned;
            await setStorage({ allowlist });
        }
        return;
    }

    // Handle site expiration
    const domain = alarm.name;
    // Always fetch fresh state to avoid race conditions with service worker sleep
    const res = await getStorage(['allowlist']);
    const currentAllowlist = res.allowlist || {};

    if (currentAllowlist[domain]) {
        delete currentAllowlist[domain];
        await setStorage({ allowlist: currentAllowlist });

        // Notify memory (though storage.onChanged will also do this)
        allowlist = currentAllowlist;

        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            try {
                const host = new URL(tab.url).hostname.toLowerCase();
                if (host === domain || host.endsWith('.' + domain)) {
                    chrome.tabs.reload(tab.id);
                }
            } catch (e) { }
        });
    }
});
