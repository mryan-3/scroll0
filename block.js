import { TITLES, ROASTS, PHRASES, pick, validate } from './block-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('target');

    document.getElementById('title').textContent = pick(TITLES);
    document.getElementById('roastText').textContent = pick(ROASTS);

    const phrase = pick(PHRASES);
    document.getElementById('requiredPhrase').textContent = `"${phrase}"`;

    if (targetUrl) {
        const text = document.getElementById('targetUrlText');
        try { text.textContent = new URL(targetUrl).hostname; }
        catch (e) { text.textContent = targetUrl; }
    }

    const recordBtn = document.getElementById('recordBtn');
    const transcriptionBox = document.getElementById('transcriptionBox');
    const statusEl = document.getElementById('statusMessage');
    const goBackBtn = document.getElementById('goBackBtn');

    goBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'chrome://newtab';
    });

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.interimResults = true;
    let listening = false;

    recordBtn.addEventListener('click', () => {
        if (listening) { rec.stop(); return; }
        rec.start();
        listening = true;
        recordBtn.classList.add('listening');
        recordBtn.textContent = 'listening...';
        transcriptionBox.classList.remove('hidden');
        statusEl.className = 'status hidden';
    });

    rec.onresult = (ev) => {
        let interim = '', final = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
            else interim += ev.results[i][0].transcript;
        }
        transcriptionBox.textContent = interim || final;
        if (final) {
            if (validate(final, phrase)) {
                statusEl.textContent = 'access granted. enjoy your 15 min of shame.';
                statusEl.className = 'status success';
                chrome.runtime.sendMessage(
                    { action: 'allowSite', targetUrl, durationMinutes: 15 },
                    (r) => r?.success && (window.location.href = targetUrl)
                );
            } else {
                statusEl.textContent = `you said: "${final}". not quite.`;
                statusEl.className = 'status error';
            }
        }
    };

    rec.onend = () => {
        listening = false;
        recordBtn.classList.remove('listening');
        recordBtn.textContent = 'tap to talk';
    };
});
