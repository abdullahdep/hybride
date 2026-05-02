/**
 * Export Module
 * Handles exporting filtered messages to various formats
 */

class ExportManager {
    constructor() {
        this.exportFormats = ['csv', 'json', 'txt'];
    }

    /**
     * Export messages to CSV
     */
    exportToCSV(messages, filename = 'mdb_messages.csv') {
        const headers = [
            'ID',
            'Author',
            'Message',
            'Timestamp',
            'Actual Label',
            'Keyword Classification',
            'Keyword Score',
            'AI Classification',
            'AI Confidence',
            'Final Classification',
        ];

        const rows = messages.map(m => [
            m.id,
            `"${m.author}"`,
            `"${m.message.replace(/"/g, '""')}"`,
            `"${m.timestamp}"`,
            m.actualLabel || 'unknown',
            m.keywordClassification || 'N/A',
            (m.keywordScore || 0).toFixed(3),
            m.aiClassification || 'N/A',
            (m.aiConfidence || 0).toFixed(3),
            m.classification || 'unknown',
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csv, filename, 'text/csv');
    }

    /**
     * Export messages to JSON
     */
    exportToJSON(messages, filename = 'mdb_messages.json') {
        const data = {
            exportDate: new Date().toISOString(),
            totalMessages: messages.length,
            academicCount: messages.filter(m => m.classification === 'academic').length,
            nonAcademicCount: messages.filter(m => m.classification === 'non-academic').length,
            messages: messages,
        };

        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, filename, 'application/json');
    }

    /**
     * Export messages to plain text
     */
    exportToText(messages, filename = 'mdb_messages.txt') {
        let text = 'MODERATED DISCUSSION BOARD - MESSAGE EXPORT\n';
        text += '='.repeat(50) + '\n';
        text += `Export Date: ${new Date().toLocaleString()}\n`;
        text += `Total Messages: ${messages.length}\n`;
        text += `Academic Messages: ${messages.filter(m => m.classification === 'academic').length}\n`;
        text += `Non-Academic Messages: ${messages.filter(m => m.classification === 'non-academic').length}\n`;
        text += '='.repeat(50) + '\n\n';

        messages.forEach((msg, index) => {
            text += `[${index + 1}] ${msg.author} (${msg.timestamp})\n`;
            text += `Classification: ${msg.classification || 'Unknown'}\n`;
            text += `Message: ${msg.message}\n`;
            text += '-'.repeat(50) + '\n\n';
        });

        this.downloadFile(text, filename, 'text/plain');
    }

    /**
     * Export analytics report
     */
    exportReport(metrics, filename = 'mdb_report.txt') {
        const { keywordMetrics, aiMetrics } = metrics;

        let report = 'MDB FILTERING TOOL - PERFORMANCE REPORT\n';
        report += '='.repeat(60) + '\n';
        report += `Generated: ${new Date().toLocaleString()}\n\n`;

        report += 'KEYWORD-BASED FILTERING\n';
        report += '-'.repeat(60) + '\n';
        report += `Accuracy:  ${(keywordMetrics.accuracy * 100).toFixed(2)}%\n`;
        report += `Precision: ${(keywordMetrics.precision * 100).toFixed(2)}%\n`;
        report += `Recall:    ${(keywordMetrics.recall * 100).toFixed(2)}%\n`;
        report += `F1-Score:  ${(keywordMetrics.f1Score * 100).toFixed(2)}%\n\n`;

        report += 'AI CLASSIFICATION\n';
        report += '-'.repeat(60) + '\n';
        report += `Accuracy:  ${(aiMetrics.accuracy * 100).toFixed(2)}%\n`;
        report += `Precision: ${(aiMetrics.precision * 100).toFixed(2)}%\n`;
        report += `Recall:    ${(aiMetrics.recall * 100).toFixed(2)}%\n`;
        report += `F1-Score:  ${(aiMetrics.f1Score * 100).toFixed(2)}%\n\n`;

        report += 'RECOMMENDATIONS\n';
        report += '-'.repeat(60) + '\n';
        report += this.generateRecommendations(keywordMetrics, aiMetrics);

        this.downloadFile(report, filename, 'text/plain');
    }

    /**
     * Generate recommendations based on metrics
     */
    generateRecommendations(keywordMetrics, aiMetrics) {
        let recommendations = '';

        if (keywordMetrics.accuracy > aiMetrics.accuracy) {
            recommendations += '• Keyword filtering shows better overall accuracy\n';
        } else {
            recommendations += '• AI classification shows better overall accuracy\n';
        }

        if (keywordMetrics.precision > 0.9) {
            recommendations += '• Keyword filtering has high precision - few false positives\n';
        }

        if (aiMetrics.recall > keywordMetrics.recall) {
            recommendations += '• AI classification catches more non-academic messages\n';
        }

        recommendations += '• Consider combining both approaches for optimal results\n';
        recommendations += '• Review misclassified examples to improve models\n';

        return recommendations;
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }
}

// Initialize global instance
const exportManager = new ExportManager();
