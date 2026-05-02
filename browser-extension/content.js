/**
 * Content Script for Chrome Extension
 * Injects filtering functionality into LMS pages
 */

(function () {
if (window.__mdbFilteringToolLoaded) {
    console.log('MDB Filtering Tool content script already loaded');
    return;
}
window.__mdbFilteringToolLoaded = true;

// Message styles
const mdbFilterStyles = `
    .mdb-filter-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 8px;
    }
    
    .mdb-filter-badge.academic {
        background-color: #d4edda;
        color: #155724;
    }
    
    .mdb-filter-badge.non-academic {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .mdb-filtered-message {
        opacity: 0.5;
        text-decoration: line-through;
    }
`;

// Inject styles
if (!document.getElementById('mdb-filter-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'mdb-filter-styles';
    styleElement.textContent = mdbFilterStyles;
    document.head.appendChild(styleElement);
}

// Keyword patterns for classification
const patterns = {
    greeting: /\b(hi|hello|hey|assalam|salaam|greetings|sir|dear|student)\b/gi,
    affirmation: /\b(good|ok|okay|done|yes|sure|agreed|fine|thanks|thank you)\b/gi,
    presence: /\b(present|here|attendance|check-in|checking in|submit)\b/gi,
    contact: /\b(phone|whatsapp|wa|group link|contact|number|call)\b/gi,
    course_related: /\b(assignment|homework|project|exam|quiz|grade|lecture|course|deadline|submit|handout|syllabus|rubric)\b/gi,
    academic_content: /\b(concept|formula|derive|machine learning|virtualization|hypervisor|virtual|operating system|resource|allocation|consolidation)\b/gi,
    casual: /\b(lol|haha|thanks|ok|yeah|nope|dunno|gonna|btw)\b/gi,
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeAndClassify') {
        const results = analyzeAndClassifyAll();
        sendResponse(results);
    } else if (request.action === 'getMessages') {
        const messages = extractMessagesFromPage();
        sendResponse({ messages: messages });
    }
});

/**
 * Extract and classify all messages on the page
 */
function analyzeAndClassifyAll() {
    const messages = extractMessagesFromPage();
    const classified = [];
    
    messages.forEach((msg, index) => {
        const classification = classifyMessage(msg.text);
        classified.push({
            id: index,
            text: msg.text.substring(0, 150), // Short preview
            fullText: msg.text,
            classification: classification.type,
            confidence: classification.confidence,
            matchedPatterns: classification.patterns,
        });
    });

    annotateMessagesOnPage(messages, classified);

    // Calculate statistics
    const academic = classified.filter(m => m.classification === 'academic').length;
    const nonAcademic = classified.filter(m => m.classification === 'non-academic').length;

    return {
        success: true,
        totalMessages: classified.length,
        academicCount: academic,
        nonAcademicCount: nonAcademic,
        academicPercentage: classified.length > 0 ? Math.round((academic / classified.length) * 100) : 0,
        nonAcademicPercentage: classified.length > 0 ? Math.round((nonAcademic / classified.length) * 100) : 0,
        pageUrl: window.location.href,
        messages: classified
    };
}

/**
 * Classify a single message
 */
function classifyMessage(text) {
    if (!text || text.trim().length === 0) {
        return { type: 'academic', confidence: 0, patterns: [] };
    }

    const textLower = text.toLowerCase();
    const matchedPatterns = [];
    let academicScore = 0;
    let nonAcademicScore = 0;

    // Check for pattern matches
    for (const [patternName, pattern] of Object.entries(patterns)) {
        pattern.lastIndex = 0;
        if (pattern.test(textLower)) {
            matchedPatterns.push(patternName);
            
            // Strong academic indicators
            if (patternName === 'academic_content' || patternName === 'course_related') {
                academicScore += 0.4;
            }
            // Casual/non-academic indicators
            else if (patternName === 'casual' || patternName === 'greeting' || patternName === 'affirmation') {
                nonAcademicScore += 0.25;
            }
            // Contact/presence indicators
            else if (patternName === 'contact' || patternName === 'presence') {
                nonAcademicScore += 0.35;
            }
        }
    }

    // Length heuristic
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 5) {
        nonAcademicScore += 0.15;
    } else if (wordCount > 30) {
        academicScore += 0.15;
    }

    // If contains instructor-style response, it's academic
    if (textLower.includes('instructor') || textLower.includes('dear student') || textLower.includes('process of')) {
        academicScore += 0.5;
    }

    // Determine classification
    const isAcademic = academicScore >= nonAcademicScore;
    const maxScore = Math.max(academicScore, nonAcademicScore);
    const confidence = Math.max(50, Math.round(maxScore * 100));

    return {
        type: isAcademic ? 'academic' : 'non-academic',
        confidence: confidence,
        patterns: matchedPatterns
    };
}

/**
 * Extract messages from Discussion Board / MDB section
 */
function extractMessagesFromPage() {
    const messages = [];
    const textSet = new Set();

    extractFromKnownMessageContainers(messages, textSet);
    if (messages.length > 0) {
        console.log(`Extracted ${messages.length} messages from known message containers`);
        return messages;
    }

    // First, try to find discussion board section
    const mdbSection = findMDBSection();
    
    if (mdbSection) {
        // Extract from MDB section specifically
        extractFromSection(mdbSection, messages, textSet);
    } else {
        // Fallback: extract from entire page
        extractFromEntirePage(messages, textSet);
    }

    console.log(`Extracted ${messages.length} messages from page`);
    return messages;
}

/**
 * Find Moderated Discussion Board section
 */
function findMDBSection() {
    // Look for discussion board indicators - more flexible matching
    // Common MDB section identifiers
    const mdbIndicators = [
        'moderated discussion board', 
        'discussion forum', 
        'forum posts', 
        'message board',
        'mdb',
        'questions',
        'discussion',
        'forum'
    ];
    
    // Find the best matching element
    let bestMatch = null;
    let bestMatchCount = 0;
    
    const allElements = document.querySelectorAll('div, section, article, main, [role="main"]');
    
    for (const element of allElements) {
        const elementText = element.innerText.toLowerCase();
        
        // Count how many indicators are in this element
        let matchCount = 0;
        for (const indicator of mdbIndicators) {
            if (elementText.includes(indicator)) {
                matchCount++;
            }
        }
        
        // If this element has discussion-like content (questions/answers pattern)
        if (matchCount > 0 || (elementText.match(/\b(sir|dear|student|instructor|reply|question)\b/gi) || []).length > 3) {
            // Prefer larger sections with more content
            if (matchCount >= bestMatchCount) {
                bestMatchCount = matchCount;
                bestMatch = element;
            }
        }
    }
    
    console.log(`Found MDB section: ${bestMatch ? 'Yes' : 'No'} (matches: ${bestMatchCount})`);
    return bestMatch;
}

/**
 * Extract obvious discussion/message cards before falling back to broad page scans.
 */
function extractFromKnownMessageContainers(messages, textSet) {
    const selectors = [
        '.message',
        '.post',
        '.discussion-message',
        '.forum-post',
        '.comment',
        '[data-message]',
        '[role="article"]'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    elements.forEach((element) => {
        addMessageFromElement(element, messages, textSet, false);
    });
}

/**
 * Extract messages from a specific section
 */
function extractFromSection(section, messages, textSet) {
    // Get all paragraphs and divs with substantial text
    const elements = section.querySelectorAll('p, div, span, li');
    
    elements.forEach(el => {
        addMessageFromElement(el, messages, textSet, true);
    });
    
    console.log(`Extracted ${messages.length} messages from MDB section`);
}

function addMessageFromElement(element, messages, textSet, requireMessageShape) {
    const text = (element.innerText || element.textContent || '').trim();

    if (text.length <= 15 || text.length >= 1000 || textSet.has(text)) {
        return;
    }

    if (isMetadata(text) || isUIText(text)) {
        return;
    }

    if (requireMessageShape && !isLikelyMessage(text)) {
        return;
    }

    textSet.add(text);
    messages.push({
        id: messages.length,
        text: text,
        element: element,
    });
    console.log(`Added: ${text.substring(0, 50)}...`);
}

/**
 * Add visual badges on the source page so the user sees what was found.
 */
function annotateMessagesOnPage(messages, classified) {
    messages.forEach((message, index) => {
        if (!message.element || !classified[index]) {
            return;
        }

        const existingBadge = message.element.querySelector(':scope > .mdb-filter-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        const result = classified[index];
        const badge = document.createElement('span');
        badge.className = `mdb-filter-badge ${result.classification}`;
        badge.textContent = `${result.classification.toUpperCase()} (${result.confidence}%)`;
        message.element.appendChild(badge);
    });
}

/**
 * Check if text looks like a discussion message
 */
function isLikelyMessage(text) {
    // Must contain some meaningful content indicators
    const indicators = [
        /\b(what|how|why|where|when|who|is|are|can|could|would|should)\b/i,
        /\b(sir|dear|student|instructor|please|thanks|help|question|explain|understand)\b/i,
        /\b(concept|means|definition|example|process|method|course|assignment)\b/i,
    ];
    
    let hasIndicator = false;
    for (const indicator of indicators) {
        if (indicator.test(text)) {
            hasIndicator = true;
            break;
        }
    }
    
    // Avoid pure lists or bullet points
    if (text.split('\n').length > 10) return false;
    
    return hasIndicator;
}

/**
 * Extract from entire page (fallback)
 */
function extractFromEntirePage(messages, textSet) {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        let text = node.textContent.trim();

        if (text.length > 15 && text.length < 500 && !textSet.has(text)) {
            if (!isUIText(text) && !isMetadata(text)) {
                textSet.add(text);
                messages.push({
                    id: messages.length,
                    text: text,
                });
            }
        }
    }
}

/**
 * Check if text is metadata (timestamps, user IDs, etc)
 */
function isMetadata(text) {
    // Skip user IDs, roll numbers, timestamps
    if (/^[A-Z]{2}\d{8}/.test(text)) return true; // Roll numbers
    if (/day ago|hour ago|minute ago|week ago/.test(text)) return true; // Timestamps
    if (/instructor's reply|instructor reply/i.test(text)) return true; // Reply labels
    if (/^[0-9]{1,2}$/.test(text)) return true; // Just numbers
    return false;
}

/**
 * Check if text is UI element (skip these)
 */
function isUIText(text) {
    const lowerText = text.toLowerCase();
    const uiPatterns = [
        'cookie', 'accept', 'reject', 'privacy', 'terms', 'subscribe',
        'email', 'password', 'login', 'sign in', 'sign up', 'copyright',
        'follow us', 'share', 'like', 'comment', 'view more', 'load more',
        'search', 'filter', 'sort', 'menu', 'navigation', 'home', 'about',
        'contact', 'help', 'disclaimer', 'all rights reserved', 'terms of service',
        'virtual university', 'federal government', 'youtube'
    ];

    return uiPatterns.some(pattern => lowerText.includes(pattern));
}

console.log('MDB Filtering Tool content script loaded');
})();
