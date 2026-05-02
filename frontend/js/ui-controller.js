/**
 * UI Controller Module
 * Manages user interface interactions and rendering
 */

class UIController {
    constructor() {
        this.initializeEventListeners();
        this.metrics = null;
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Load demo data
        const loadDemoBtn = document.getElementById('load-demo');
        if (loadDemoBtn) {
            loadDemoBtn.addEventListener('click', () => this.handleLoadDemo());
        }

        // Export CSV
        const exportBtn = document.getElementById('export-csv');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Show metrics
        const metricsBtn = document.getElementById('show-metrics');
        if (metricsBtn) {
            metricsBtn.addEventListener('click', () => this.showMetricsModal());
        }

        // Filter toggles
        const filterToggles = document.querySelectorAll('.filter-toggle');
        filterToggles.forEach(toggle => {
            toggle.addEventListener('change', () => this.handleFilterChange());
        });

        // Display mode radio buttons
        const displayModes = document.querySelectorAll('input[name="display-mode"]');
        displayModes.forEach(mode => {
            mode.addEventListener('change', () => this.handleDisplayModeChange());
        });

        // Search box
        const searchBox = document.getElementById('search-messages');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Modal close button
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMetricsModal());
        }

        // Close modal on outside click
        const modal = document.getElementById('metrics-modal');
        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.closeMetricsModal();
                }
            });
        }
    }

    /**
     * Handle load demo data
     */
    async handleLoadDemo() {
        const loadBtn = document.getElementById('load-demo');
        loadBtn.disabled = true;
        loadBtn.textContent = 'Loading...';

        try {
            // Load demo data
            await dataLoader.loadDemoData();
            
            // Classify all messages
            dataLoader.classifyAll();
            
            // Render messages
            this.renderMessages();
            
            // Update statistics
            this.updateStatistics();
            
            // Get and store metrics
            this.metrics = dataLoader.getMetrics();

            loadBtn.textContent = 'Load Demo Data';
            loadBtn.disabled = false;
        } catch (error) {
            console.error('Error loading demo data:', error);
            loadBtn.textContent = 'Load Demo Data';
            loadBtn.disabled = false;
        }
    }

    /**
     * Render messages to the DOM
     */
    renderMessages() {
        const container = document.getElementById('messages-container');
        const displayMode = document.querySelector('input[name="display-mode"]:checked').value;
        const keywordEnabled = document.getElementById('keyword-filter').checked;
        const aiEnabled = document.getElementById('ai-filter').checked;

        let messages = [...dataLoader.messages];

        // Filter by display mode
        if (displayMode === 'academic') {
            messages = messages.filter(m => m.classification === 'academic');
        } else if (displayMode === 'non-academic') {
            messages = messages.filter(m => m.classification === 'non-academic');
        }

        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No messages found.</p></div>';
            return;
        }

        container.innerHTML = messages.map(msg => this.createMessageCard(msg, keywordEnabled, aiEnabled)).join('');
    }

    /**
     * Create message card HTML
     */
    createMessageCard(message, showKeywordBadge, showAIBadge) {
        const classType = message.classification === 'academic' ? 'academic' : 'non-academic';
        const actualType = message.actualLabel === 'academic' ? 'academic' : 'non-academic';

        let badgesHTML = '';
        
        if (showKeywordBadge) {
            const keywordType = message.keywordClassification === 'academic' ? 'academic' : 'non-academic';
            const keywordMatch = message.keywordClassification !== message.actualLabel ? ' mismatch' : '';
            badgesHTML += `<span class="badge keyword${keywordMatch}">Keyword: ${keywordType}</span>`;
        }

        if (showAIBadge) {
            const aiType = message.aiClassification === 'academic' ? 'academic' : 'non-academic';
            const aiMatch = message.aiClassification !== message.actualLabel ? ' mismatch' : '';
            badgesHTML += `<span class="badge ai${aiMatch}">AI: ${aiType}</span>`;
        }

        return `
            <div class="message-card ${classType}">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(message.author)}</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-content">
                    ${this.escapeHtml(message.message)}
                </div>
                <div class="message-meta">
                    <span class="badge ${actualType}">Actual: ${actualType}</span>
                    ${badgesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        const totalCount = dataLoader.messages.length;
        const academicCount = dataLoader.messages.filter(m => m.classification === 'academic').length;
        const nonAcademicCount = totalCount - academicCount;

        document.getElementById('total-messages').textContent = totalCount;
        document.getElementById('academic-count').textContent = academicCount;
        document.getElementById('non-academic-count').textContent = nonAcademicCount;
    }

    /**
     * Handle filter change
     */
    handleFilterChange() {
        this.renderMessages();
    }

    /**
     * Handle display mode change
     */
    handleDisplayModeChange() {
        this.renderMessages();
    }

    /**
     * Handle search
     */
    handleSearch(searchText) {
        // Implement search highlighting
        const cards = document.querySelectorAll('.message-card');
        const term = searchText.toLowerCase();

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (term && text.includes(term)) {
                card.style.display = 'block';
                card.style.opacity = '1';
            } else if (term) {
                card.style.display = 'none';
            } else {
                card.style.display = 'block';
                card.style.opacity = '1';
            }
        });
    }

    /**
     * Handle export
     */
    handleExport() {
        const messages = dataLoader.messages.filter(m => m.classification === 'academic');
        const csv = this.convertToCSV(messages);
        this.downloadCSV(csv, 'academic_messages.csv');
    }

    /**
     * Convert messages to CSV
     */
    convertToCSV(messages) {
        const headers = ['Author', 'Message', 'Timestamp', 'Keyword Classification', 'AI Classification'];
        const rows = messages.map(m => [
            `"${m.author}"`,
            `"${m.message.replace(/"/g, '""')}"`,
            `"${m.timestamp}"`,
            `"${m.keywordClassification}"`,
            `"${m.aiClassification}"`,
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Show metrics modal
     */
    showMetricsModal() {
        if (!this.metrics) {
            alert('Please load demo data first.');
            return;
        }

        const modal = document.getElementById('metrics-modal');
        const { keywordMetrics, aiMetrics } = this.metrics;

        // Update metrics display
        document.getElementById('keyword-accuracy').textContent = (keywordMetrics.accuracy * 100).toFixed(2) + '%';
        document.getElementById('keyword-precision').textContent = (keywordMetrics.precision * 100).toFixed(2) + '%';
        document.getElementById('keyword-recall').textContent = (keywordMetrics.recall * 100).toFixed(2) + '%';
        document.getElementById('keyword-f1').textContent = (keywordMetrics.f1Score * 100).toFixed(2) + '%';

        document.getElementById('ai-accuracy').textContent = (aiMetrics.accuracy * 100).toFixed(2) + '%';
        document.getElementById('ai-precision').textContent = (aiMetrics.precision * 100).toFixed(2) + '%';
        document.getElementById('ai-recall').textContent = (aiMetrics.recall * 100).toFixed(2) + '%';
        document.getElementById('ai-f1').textContent = (aiMetrics.f1Score * 100).toFixed(2) + '%';

        // Show misclassified
        this.displayMisclassified();

        modal.classList.add('show');
    }

    /**
     * Close metrics modal
     */
    closeMetricsModal() {
        const modal = document.getElementById('metrics-modal');
        modal.classList.remove('show');
    }

    /**
     * Display misclassified examples
     */
    displayMisclassified() {
        const misclassified = dataLoader.getMisclassified();
        const container = document.getElementById('misclassified-list');

        if (misclassified.length === 0) {
            container.innerHTML = '<p>No misclassified examples found.</p>';
            return;
        }

        container.innerHTML = misclassified.slice(0, 5).map(msg => `
            <div class="misclassified-item">
                <p class="misclassified-text">"${this.escapeHtml(msg.message)}"</p>
                <p class="misclassified-reason">
                    Actual: ${msg.actualLabel} | 
                    Keyword: ${msg.keywordClassification} | 
                    AI: ${msg.aiClassification}
                </p>
            </div>
        `).join('');
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize UI controller
const uiController = new UIController();
