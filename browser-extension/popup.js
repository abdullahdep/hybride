/**
 * Popup Script for Chrome Extension
 * Reads text from the active page, sends it to the backend model, and shows results.
 */

const API_BASE_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const classifyBtn = document.getElementById('classifyBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const messagesListDiv = document.getElementById('messagesList');

    classifyBtn.addEventListener('click', async () => {
        setStatus('Reading opened page...', true);
        clearResults();

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.id) {
                setStatus('Error: No active tab', false, true);
                return;
            }

            const pageData = await readOpenedPage(tab.id);
            if (!pageData.messages.length) {
                displayResults(buildEmptyResponse(pageData.pageUrl));
                setStatus('No readable text found on page', false, true);
                return;
            }

            setStatus(`Sending ${pageData.messages.length} text items to backend...`, true);
            const backendData = await classifyWithBackend(pageData.messages);
            const response = buildPopupResponse(backendData, pageData);

            await annotateOpenedPage(tab.id, response.messages);
            displayResults(response);
            setStatus(`Found ${response.totalMessages} text items`, true);

            setTimeout(() => {
                setStatus('Complete!', false);
            }, 1500);
        } catch (error) {
            console.error('Analysis failed:', error);
            setStatus(error.message || 'Analysis failed', false, true);
        }
    });

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    function clearResults() {
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
        if (messagesListDiv) {
            messagesListDiv.innerHTML = '';
        }
    }

    function setStatus(message, active, autoReset) {
        statusDiv.textContent = message;
        statusDiv.classList.toggle('active', Boolean(active));
        statusDiv.style.fontSize = '12px';

        if (autoReset) {
            setTimeout(() => {
                statusDiv.textContent = 'Inactive';
                statusDiv.classList.remove('active');
            }, 3500);
        }
    }

    async function readOpenedPage(tabId) {
        let injectionResults;

        try {
            injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: collectReadablePageText
            });
        } catch (error) {
            throw new Error('Cannot read this page. Try a normal website tab, not chrome:// or the extensions page.');
        }

        const pageData = injectionResults && injectionResults[0] && injectionResults[0].result;
        return pageData || { pageUrl: 'Current Page', messages: [] };
    }

    async function classifyWithBackend(messages) {
        let response;

        try {
            response = await fetch(`${API_BASE_URL}/api/classify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    methods: ['keyword', 'ai']
                })
            });
        } catch (error) {
            throw new Error('Backend is not running. Start it on http://localhost:5000, then try again.');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.status !== 'success') {
            throw new Error((data && data.message) || 'Backend could not classify the page text.');
        }

        return data;
    }

    function buildPopupResponse(backendData, pageData) {
        const messages = backendData.results.map((item, index) => {
            const finalClassification = item.final_classification || getBestAvailableClassification(item);
            const confidence = getBestAvailableConfidence(item);

            return {
                id: index,
                text: item.message.substring(0, 180),
                fullText: item.message,
                classification: finalClassification,
                confidence: confidence,
                keyword: item.keyword || null,
                ai: item.ai || null
            };
        });

        const academicCount = messages.filter(message => message.classification === 'academic').length;
        const nonAcademicCount = messages.filter(message => message.classification === 'non-academic').length;

        return {
            success: true,
            totalMessages: messages.length,
            academicCount: academicCount,
            nonAcademicCount: nonAcademicCount,
            academicPercentage: messages.length ? Math.round((academicCount / messages.length) * 100) : 0,
            nonAcademicPercentage: messages.length ? Math.round((nonAcademicCount / messages.length) * 100) : 0,
            pageUrl: pageData.pageUrl,
            modelLoaded: backendData.model_loaded,
            messages: messages
        };
    }

    function getBestAvailableClassification(item) {
        if (item.ai && item.ai.classification) {
            return item.ai.classification;
        }
        if (item.keyword && item.keyword.classification) {
            return item.keyword.classification;
        }
        return 'academic';
    }

    function getBestAvailableConfidence(item) {
        if (item.ai && typeof item.ai.confidence === 'number') {
            return Math.round(item.ai.confidence * 100);
        }
        if (item.keyword && typeof item.keyword.confidence === 'number') {
            return Math.round(item.keyword.confidence * 100);
        }
        return 50;
    }

    function buildEmptyResponse(pageUrl) {
        return {
            success: true,
            totalMessages: 0,
            academicCount: 0,
            nonAcademicCount: 0,
            academicPercentage: 0,
            nonAcademicPercentage: 0,
            pageUrl: pageUrl,
            modelLoaded: false,
            messages: []
        };
    }

    async function annotateOpenedPage(tabId, messages) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: annotatePageResults,
                args: [messages.map(message => ({
                    fullText: message.fullText,
                    classification: message.classification,
                    confidence: message.confidence
                }))]
            });
        } catch (error) {
            console.warn('Page annotation skipped:', error.message);
        }
    }

    function displayResults(response) {
        if (!resultsDiv || !messagesListDiv) {
            return;
        }

        resultsDiv.style.display = 'block';
        setText('totalCount', response.totalMessages);
        setText('academicCount', response.academicCount);
        setText('nonAcademicCount', response.nonAcademicCount);
        setText('academicPercent', response.academicPercentage);
        setText('nonAcademicPercent', response.nonAcademicPercentage);

        messagesListDiv.innerHTML = '';

        const sourceDiv = document.createElement('div');
        sourceDiv.style.cssText = 'font-size: 10px; color: #999; margin-bottom: 10px;';
        sourceDiv.textContent = `Reading from: ${response.pageUrl || 'Current Page'}`;
        messagesListDiv.appendChild(sourceDiv);

        if (!response.modelLoaded) {
            const modelDiv = document.createElement('div');
            modelDiv.style.cssText = 'font-size: 10px; color: #b45309; margin-bottom: 10px;';
            modelDiv.textContent = 'Backend model file was not loaded, so keyword classification may be used.';
            messagesListDiv.appendChild(modelDiv);
        }

        response.messages.slice(0, 20).forEach((msg) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message-item ${msg.classification}`;

            const badge = document.createElement('span');
            badge.className = `badge-inline ${msg.classification}`;
            badge.textContent = `${msg.classification.toUpperCase()} ${msg.confidence}%`;

            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = msg.text;

            msgDiv.appendChild(badge);
            msgDiv.appendChild(textDiv);
            messagesListDiv.appendChild(msgDiv);
        });

        if (response.messages.length > 20) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'more-messages';
            moreDiv.textContent = `... and ${response.messages.length - 20} more text items`;
            messagesListDiv.appendChild(moreDiv);
        }

        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    function setText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
});

function collectReadablePageText() {
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME']);
    const selectors = [
        '[role="article"]',
        '.message',
        '.post',
        '.comment',
        '.discussion-message',
        '.forum-post',
        'p',
        'li',
        'td',
        'th',
        'blockquote',
        'label',
        'button',
        'a',
        'h1',
        'h2',
        'h3',
        'h4'
    ];
    const textSet = new Set();
    const messages = [];

    document.querySelectorAll(selectors.join(', ')).forEach((element) => {
        if (isVisible(element)) {
            addText(element.innerText || element.textContent || '');
        }
    });

    document.querySelectorAll('input, textarea, select').forEach((element) => {
        if (!isVisible(element)) {
            return;
        }

        addText(element.value || element.placeholder || element.getAttribute('aria-label') || '');
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || ignoredTags.has(parent.tagName) || !isVisible(parent)) {
            continue;
        }
        addText(node.textContent || '');
    }

    function addText(rawText) {
        const text = rawText.replace(/\s+/g, ' ').trim();

        if (text.length < 8 || text.length > 1200 || textSet.has(text)) {
            return;
        }

        if (isPageChromeText(text)) {
            return;
        }

        textSet.add(text);
        messages.push(text);
    }

    function isPageChromeText(text) {
        const lowerText = text.toLowerCase();
        const blocked = [
            'cookie',
            'privacy policy',
            'terms of service',
            'all rights reserved',
            'subscribe',
            'login',
            'sign in',
            'password'
        ];

        return blocked.some(pattern => lowerText.includes(pattern));
    }

    function isVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0;
    }

    return {
        pageUrl: window.location.href,
        pageTitle: document.title,
        messages: messages.slice(0, 100)
    };
}

function annotatePageResults(results) {
    const styleId = 'mdb-filter-popup-result-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .mdb-filter-result-badge {
                display: inline-block;
                margin-left: 8px;
                padding: 3px 7px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
            }
            .mdb-filter-result-badge.academic {
                background: #d4edda;
                color: #155724;
            }
            .mdb-filter-result-badge.non-academic {
                background: #f8d7da;
                color: #721c24;
            }
        `;
        document.head.appendChild(style);
    }

    document.querySelectorAll('.mdb-filter-result-badge').forEach(badge => badge.remove());

    const candidates = Array.from(document.querySelectorAll(
        '.message, .post, .comment, .discussion-message, .forum-post, p, li, blockquote'
    ));

    results.slice(0, 50).forEach((result) => {
        const match = candidates.find((element) => {
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            return text && (text === result.fullText || text.includes(result.fullText.substring(0, 80)));
        });

        if (!match) {
            return;
        }

        const badge = document.createElement('span');
        badge.className = `mdb-filter-result-badge ${result.classification}`;
        badge.textContent = `${result.classification.toUpperCase()} ${result.confidence}%`;
        match.appendChild(badge);
    });
}
