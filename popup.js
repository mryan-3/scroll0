import { validateDomain, saveList, getList } from './popup-logic.js';

document.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('domainInput');
    const addBtn = document.getElementById('addDomainBtn');
    const container = document.getElementById('blocklistContainer');
    const emptyState = document.getElementById('emptyState');
    const siteCount = document.getElementById('siteCount');

    let blocklist = await getList();
    render();

    chrome.storage.onChanged.addListener((changes, ns) => {
        if (ns === 'local' && changes.blocklist) {
            blocklist = changes.blocklist.newValue || [];
            render();
        }
    });

    const add = async () => {
        const domain = validateDomain(input.value);
        if (domain && !blocklist.includes(domain)) {
            blocklist.push(domain);
            await saveList(blocklist);
            input.value = '';
        }
    };

    addBtn.addEventListener('click', add);
    input.addEventListener('keypress', (e) => e.key === 'Enter' && add());

    function render() {
        container.innerHTML = '';
        siteCount.textContent = blocklist.length;

        if (blocklist.length === 0) {
            emptyState.classList.remove('hidden');
            container.style.display = 'none';
            return;
        }

        emptyState.classList.add('hidden');
        container.style.display = 'flex';

        blocklist.forEach(domain => {
            const li = document.createElement('li');
            li.className = 'block-item';
            li.innerHTML = `<span class="domain-name">${domain}</span>`;

            const btn = document.createElement('button');
            btn.className = 'remove-btn';
            btn.textContent = 'Remove';
            btn.onclick = async () => {
                blocklist = blocklist.filter(d => d !== domain);
                await saveList(blocklist);
            };

            li.appendChild(btn);
            container.appendChild(li);
        });
    }
});
