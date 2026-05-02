/**
 * Keyword-Based Filtering Module
 * Implements regex-based non-academic message detection
 */

class KeywordFilter {
    constructor(patterns = CONFIG.KEYWORD_PATTERNS) {
        this.patterns = patterns;
        this.customKeywords = this.loadCustomKeywords();
    }

    /**
     * Load custom keywords from local storage
     */
    loadCustomKeywords() {
        const stored = localStorage.getItem(CONFIG.STORAGE.CUSTOM_KEYWORDS);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save custom keywords to local storage
     */
    saveCustomKeywords() {
        localStorage.setItem(CONFIG.STORAGE.CUSTOM_KEYWORDS, JSON.stringify(this.customKeywords));
    }

    /**
     * Add custom keyword pattern
     */
    addCustomKeyword(keyword) {
        if (!this.customKeywords.includes(keyword)) {
            this.customKeywords.push(keyword);
            this.saveCustomKeywords();
        }
    }

    /**
     * Classify message based on keyword patterns
     */
    classify(message) {
        const result = {
            isNonAcademic: false,
            score: 0,
            matchedPatterns: [],
            confidence: 0,
        };

        if (!message || message.trim().length === 0) return result;

        const text = message.toLowerCase();
        let matchCount = 0;
        let totalPatterns = 0;

        // Check built-in patterns
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            if (pattern.global || pattern.source.includes('g')) {
                // Reset lastIndex for global patterns
                if (pattern.global) pattern.lastIndex = 0;
                
                const matches = message.match(pattern);
                totalPatterns++;
                
                if (matches && matches.length > 0) {
                    matchCount++;
                    result.matchedPatterns.push({
                        pattern: patternName,
                        matches: matches,
                        count: matches.length,
                    });
                }
            }
        }

        // Check custom keywords
        for (const keyword of this.customKeywords) {
            totalPatterns++;
            const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = message.match(keywordRegex);
            
            if (matches && matches.length > 0) {
                matchCount++;
                result.matchedPatterns.push({
                    pattern: `custom_${keyword}`,
                    matches: matches,
                    count: matches.length,
                });
            }
        }

        // Calculate scores
        if (totalPatterns > 0) {
            result.score = matchCount / totalPatterns;
            result.confidence = this.calculateConfidence(message, matchCount);
        }

        // Determine if non-academic
        result.isNonAcademic = result.score >= CONFIG.THRESHOLDS.KEYWORD_SCORE_THRESHOLD;

        return result;
    }

    /**
     * Calculate confidence score based on message characteristics
     */
    calculateConfidence(message, matchCount) {
        let confidence = 0;

        // Length consideration
        const wordCount = message.split(/\s+/).length;
        if (wordCount <= 5) confidence += 0.2; // Short messages more likely non-academic
        else if (wordCount > 20) confidence -= 0.1; // Longer messages more likely academic

        // Match count consideration
        if (matchCount > 3) confidence += 0.3;
        else if (matchCount > 1) confidence += 0.2;
        else if (matchCount > 0) confidence += 0.1;

        // Phone number detection (very strong indicator)
        if (CONFIG.KEYWORD_PATTERNS.phoneNumber.test(message)) {
            confidence += 0.4;
        }

        // URL detection
        if (CONFIG.KEYWORD_PATTERNS.url.test(message)) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1); // Cap at 1.0
    }

    /**
     * Batch classify messages
     */
    classifyBatch(messages) {
        return messages.map(msg => ({
            message: msg,
            ...this.classify(msg),
        }));
    }

    /**
     * Extract matched keywords from message
     */
    extractMatches(message) {
        const result = this.classify(message);
        return result.matchedPatterns.flatMap(p => p.matches);
    }

    /**
     * Get pattern statistics
     */
    getStatistics(messages) {
        const stats = {
            totalMessages: messages.length,
            nonAcademicCount: 0,
            academicCount: 0,
            averageScore: 0,
            commonPatterns: {},
        };

        let totalScore = 0;

        for (const message of messages) {
            const result = this.classify(message);
            
            if (result.isNonAcademic) {
                stats.nonAcademicCount++;
            } else {
                stats.academicCount++;
            }

            totalScore += result.score;

            // Track pattern frequencies
            for (const pattern of result.matchedPatterns) {
                stats.commonPatterns[pattern.pattern] = 
                    (stats.commonPatterns[pattern.pattern] || 0) + 1;
            }
        }

        stats.averageScore = messages.length > 0 ? totalScore / messages.length : 0;

        return stats;
    }
}

// Initialize global instance
const keywordFilter = new KeywordFilter();
