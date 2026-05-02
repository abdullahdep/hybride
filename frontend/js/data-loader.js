/**
 * Data Loader Module
 * Handles loading and management of message data
 */

class DataLoader {
    constructor() {
        this.messages = [];
        this.filteredMessages = [];
    }

    /**
     * Load demo messages (simulated MDB data)
     */
    async loadDemoData() {
        try {
            const demoMessages = this.generateDemoMessages();
            this.messages = demoMessages;
            return demoMessages;
        } catch (error) {
            console.error('Error loading demo data:', error);
            return [];
        }
    }

    /**
     * Generate realistic demo MDB messages
     */
    generateDemoMessages() {
        const academicMessages = [
            "I found the reference material in Chapter 3 to be particularly helpful for understanding the concept.",
            "Could someone explain the methodology used in the research paper?",
            "This is an excellent point. Has anyone considered the alternative approach?",
            "I disagree with the proposed solution. Let me suggest a better approach based on my research.",
            "The assignment requires us to implement the algorithm as described in the documentation.",
            "Can someone provide guidance on how to approach this problem?",
            "I've completed the analysis and found some interesting patterns in the data.",
            "This concept relates to what we discussed in the previous module.",
        ];

        const nonAcademicMessages = [
            "Good",
            "Done",
            "Present",
            "Thanks for sharing!",
            "Hi everyone",
            "03215647890", // Phone number
            "Anyone for WhatsApp group?",
            "+923015678901",
            "Sir, please check my work",
            "OK thanks",
            "👍",
            "Will do",
            "Thanks buddy",
            "Same here",
            "I agree",
        ];

        const authors = [
            'Ahmed Khan', 'Fatima Ali', 'Hassan Mirza', 'Zainab Hussain',
            'Muhammad Ramzan', 'Ayesha Malik', 'Omar Ahmed', 'Sara Khan',
        ];

        const messages = [];
        let id = 1;

        // Mix academic and non-academic messages
        for (let i = 0; i < 40; i++) {
            const isAcademic = Math.random() > 0.4; // 60% academic, 40% non-academic
            const messageText = isAcademic 
                ? academicMessages[Math.floor(Math.random() * academicMessages.length)]
                : nonAcademicMessages[Math.floor(Math.random() * nonAcademicMessages.length)];

            messages.push({
                id: id++,
                author: authors[Math.floor(Math.random() * authors.length)],
                message: messageText,
                timestamp: this.getRandomTimestamp(),
                actualLabel: isAcademic ? 'academic' : 'non-academic', // Ground truth
                courseId: 'CS619-11757',
            });
        }

        return messages;
    }

    /**
     * Generate random timestamp
     */
    getRandomTimestamp() {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
        return date.toLocaleString();
    }

    /**
     * Filter messages based on criteria
     */
    filter(criteria) {
        const { filterType, searchText } = criteria;

        let result = [...this.messages];

        // Apply search filter
        if (searchText && searchText.trim().length > 0) {
            const searchLower = searchText.toLowerCase();
            result = result.filter(msg => 
                msg.message.toLowerCase().includes(searchLower) ||
                msg.author.toLowerCase().includes(searchLower)
            );
        }

        // Apply classification filter
        if (filterType && filterType !== 'all') {
            result = result.filter(msg => msg.classification === filterType);
        }

        this.filteredMessages = result;
        return result;
    }

    /**
     * Classify all messages using both methods
     */
    classifyAll() {
        for (const message of this.messages) {
            // Keyword classification
            const keywordResult = keywordFilter.classify(message.message);
            message.keywordClassification = keywordResult.isNonAcademic ? 'non-academic' : 'academic';
            message.keywordScore = keywordResult.score;
            message.keywordPatterns = keywordResult.matchedPatterns;

            // Mock AI classification (placeholder for actual ML model)
            message.aiClassification = this.mockAIClassification(message.message);
            message.aiConfidence = Math.random() * 0.4 + 0.6; // Random confidence 0.6-1.0

            // Combined classification (can be made configurable)
            message.classification = this.combinedClassification(message);
        }

        return this.messages;
    }

    /**
     * Mock AI classification (to be replaced with actual ML model)
     */
    mockAIClassification(message) {
        // Simple heuristic: longer, more complex messages are likely academic
        const wordCount = message.split(/\s+/).length;
        const avgWordLength = message.replace(/\s/g, '').length / wordCount;
        
        if (wordCount < 5 || avgWordLength < 3) {
            return 'non-academic';
        }
        return 'academic';
    }

    /**
     * Combine keyword and AI classifications
     */
    combinedClassification(message) {
        const keywordVote = message.keywordClassification === 'non-academic' ? 1 : 0;
        const aiVote = message.aiClassification === 'non-academic' ? 1 : 0;
        
        // Majority voting
        const totalVotes = keywordVote + aiVote;
        return totalVotes >= 1 ? 'non-academic' : 'academic';
    }

    /**
     * Get classification metrics
     */
    getMetrics() {
        let keywordMetrics = {
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
        };

        let aiMetrics = {
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
        };

        if (this.messages.length === 0) return { keywordMetrics, aiMetrics };

        // Calculate metrics
        let keywordTP = 0, keywordFP = 0, keywordFN = 0, keywordTN = 0;
        let aiTP = 0, aiFP = 0, aiFN = 0, aiTN = 0;

        for (const msg of this.messages) {
            const actual = msg.actualLabel;
            
            // Keyword metrics
            const keywordPred = msg.keywordClassification;
            if (keywordPred === 'non-academic' && actual === 'non-academic') keywordTP++;
            else if (keywordPred === 'non-academic' && actual === 'academic') keywordFP++;
            else if (keywordPred === 'academic' && actual === 'non-academic') keywordFN++;
            else keywordTN++;

            // AI metrics
            const aiPred = msg.aiClassification;
            if (aiPred === 'non-academic' && actual === 'non-academic') aiTP++;
            else if (aiPred === 'non-academic' && actual === 'academic') aiFP++;
            else if (aiPred === 'academic' && actual === 'non-academic') aiFN++;
            else aiTN++;
        }

        // Calculate keyword metrics
        keywordMetrics.accuracy = (keywordTP + keywordTN) / this.messages.length;
        keywordMetrics.precision = keywordTP > 0 ? keywordTP / (keywordTP + keywordFP) : 0;
        keywordMetrics.recall = keywordTP > 0 ? keywordTP / (keywordTP + keywordFN) : 0;
        const kp = keywordMetrics.precision;
        const kr = keywordMetrics.recall;
        keywordMetrics.f1Score = (2 * kp * kr) / (kp + kr) || 0;

        // Calculate AI metrics
        aiMetrics.accuracy = (aiTP + aiTN) / this.messages.length;
        aiMetrics.precision = aiTP > 0 ? aiTP / (aiTP + aiFP) : 0;
        aiMetrics.recall = aiTP > 0 ? aiTP / (aiTP + aiFN) : 0;
        const ap = aiMetrics.precision;
        const ar = aiMetrics.recall;
        aiMetrics.f1Score = (2 * ap * ar) / (ap + ar) || 0;

        return { keywordMetrics, aiMetrics };
    }

    /**
     * Get misclassified examples
     */
    getMisclassified() {
        return this.messages.filter(msg => 
            msg.keywordClassification !== msg.actualLabel ||
            msg.aiClassification !== msg.actualLabel
        );
    }
}

// Initialize global instance
const dataLoader = new DataLoader();
