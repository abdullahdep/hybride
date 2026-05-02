/**
 * Configuration Module
 * Centralized settings for the MDB Filtering Tool
 */

const CONFIG = {
    // Application Settings
    APP_NAME: 'Hybrid MDB Filtering Tool',
    VERSION: '1.0.0',
    ENVIRONMENT: 'development',

    // Filtering Configuration
    FILTERING: {
        KEYWORD_ENABLED: true,
        AI_ENABLED: true,
        MIN_CONFIDENCE: 0.7, // Minimum confidence for AI classification
        USE_CACHE: true,
    },

    // Keyword Patterns for Non-Academic Detection
    KEYWORD_PATTERNS: {
        greeting: /\b(hi|hello|hey|assalam|greeting|salaam)\b/gi,
        affirmation: /\b(good|ok|okay|done|yes|sure|agreed|fine|great|awesome|perfect)\b/gi,
        presence: /\b(present|present sir|here|i am here|attendance|buakhair)\b/gi,
        irrelevant: /\b(thanks|thankyou|thanks for|appreciated|done|will do)\b/gi,
        phoneNumber: /(\+92|0)?3\d{2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}|[0-9]{10,}/g,
        whatsapp: /whatsapp|whats app|wa|group link|group code/gi,
        emojis: /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/gu,
        shortText: /^.{1,15}$/,
        url: /https?:\/\/[^\s]+/gi,
    },

    // Classification Thresholds
    THRESHOLDS: {
        KEYWORD_SCORE_THRESHOLD: 0.5,
        AI_CONFIDENCE_THRESHOLD: 0.7,
    },

    // Display Settings
    DISPLAY: {
        MESSAGES_PER_PAGE: 20,
        SHOW_METADATA: true,
        HIGHLIGHT_KEYWORDS: true,
    },

    // API Endpoints (for future backend integration)
    API: {
        BASE_URL: 'http://localhost:5000',
        ENDPOINTS: {
            CLASSIFY: '/api/classify',
            PREDICT: '/api/predict',
            METRICS: '/api/metrics',
            KEYWORDS: '/api/keywords',
        },
    },

    // Demo Data
    DEMO_DATA_URL: 'data/demo_messages.json',

    // Local Storage Keys
    STORAGE: {
        CUSTOM_KEYWORDS: 'mdb_custom_keywords',
        USER_PREFERENCES: 'mdb_user_preferences',
        FILTER_HISTORY: 'mdb_filter_history',
    },
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
