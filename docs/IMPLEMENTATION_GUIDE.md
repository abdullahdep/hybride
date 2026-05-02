# Project Implementation Guide

## Phase 1: Dataset Collection and Labeling

### Objectives
- Collect 500-1000 sample MDB messages
- Label messages as academic or non-academic
- Store in structured format (CSV/JSON)

### Deliverables
- `dataset/labeled_messages.csv` - Labeled dataset with columns: message, label
- Data validation report showing label distribution
- Dataset statistics (message length, class balance, etc.)

### Approach
1. Simulate MDB data using realistic message examples
2. Include diverse non-academic messages:
   - Greetings: "Hi", "Hello", "Assalam"
   - Affirmations: "Good", "Done", "Ok", "Yes"
   - Presence markers: "Present", "Here", "Attendance"
   - Contact info: Phone numbers, WhatsApp groups
   - Irrelevant: "Thanks", "Will do"
3. Include diverse academic messages:
   - Questions about concepts
   - References to course materials
   - Detailed explanations
   - Analysis and findings

## Phase 2: Implement Filtering Approaches

### Keyword-Based Filtering

**File**: `backend/keyword_filter.py`

Features:
- Regex patterns for common non-academic messages
- Custom keyword management
- Confidence scoring
- Pattern matching statistics

Key Patterns:
```
- greeting: hi, hello, hey, assalam, salaam
- affirmation: good, ok, done, yes, sure
- presence: present, here, attendance
- phone_number: Pakistani format (+92, 03XX)
- whatsapp: group links, WhatsApp mentions
```

### AI/NLP Classification

**File**: `backend/ai_classifier.py`

Approaches:
1. **TF-IDF + Logistic Regression** (default)
   - Fast training and inference
   - Interpretable feature importance
   - Good baseline performance

2. **TF-IDF + Naive Bayes**
   - Probabilistic approach
   - Fast training
   - Good for text classification

Implementation:
- Feature extraction: TF-IDF vectorizer
- Cross-validation: 5-fold for model selection
- Hyperparameter tuning: Grid search
- Model persistence: Save trained models using joblib

### Performance Metrics

Calculate for both approaches:
- **Accuracy**: (TP + TN) / Total
- **Precision**: TP / (TP + FP) - Avoid false non-academic labels
- **Recall**: TP / (TP + FN) - Catch all non-academic messages
- **F1-Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: Visual representation of errors

## Phase 3: Frontend Development

### Mock LMS Interface

**File**: `frontend/index.html`

Components:
1. **Message Display**
   - Message cards with author, timestamp, content
   - Color-coded by classification
   - Badge showing both classifier results

2. **Control Panel**
   - Toggle keyword filtering on/off
   - Toggle AI filtering on/off
   - Display mode selector (all/academic/non-academic)
   - Search functionality
   - Load demo data, export, view metrics buttons

3. **Statistics Panel**
   - Total message count
   - Academic/non-academic split
   - Real-time updates

### Dashboard Implementation

**Files**: `frontend/css/dashboard.css`, `frontend/js/ui-controller.js`

Features:
- Metrics comparison modal showing side-by-side results
- Chart visualization (Chart.js integration optional)
- Misclassified examples review section
- Performance improvement recommendations

### Export Feature

**File**: `frontend/js/export.js`

Supported formats:
- CSV: Spreadsheet-friendly format with all metadata
- JSON: Full structured data export
- TXT: Human-readable format with statistics
- Report: Performance analysis document

## Phase 4: Integration and Testing

### Browser Extension Integration

**Folder**: `browser-extension/`

Options:
1. **Tampermonkey Userscript**
   - JavaScript injection into LMS pages
   - Simpler deployment
   - Cross-browser compatible

2. **Chrome Extension**
   - More advanced features
   - Better performance
   - Chrome-specific

### Testing Strategy

1. **Unit Tests**
   - Test each filter independently
   - Verify accuracy calculations
   - Test edge cases

2. **Integration Tests**
   - Test combined filtering
   - Verify export functionality
   - Test UI interactions

3. **Performance Tests**
   - Measure classification speed
   - Test with large datasets (1000+ messages)
   - Memory usage analysis

## Usage Examples

### Python Backend

```python
from backend.keyword_filter import KeywordFilter
from backend.ai_classifier import AIClassifier
from backend.utils.data_processor import DataProcessor

# Load data
processor = DataProcessor()
processor.load_csv('dataset/labeled_messages.csv')
train_msgs, test_msgs, train_labels, test_labels = processor.split_train_test()

# Train keyword filter
keyword_filter = KeywordFilter()
keyword_results = keyword_filter.classify_batch(test_msgs)

# Train AI classifier
classifier = AIClassifier('logistic_regression')
classifier.train(train_msgs, train_labels)
ai_results = classifier.predict(test_msgs)

# Evaluate
print(classifier.evaluate(test_msgs, test_labels))
```

### Frontend Usage

1. Open `frontend/index.html` in browser
2. Click "Load Demo Data" to populate messages
3. Toggle filters on/off to see results
4. View "Metrics" for performance comparison
5. Export filtered messages using "Export to CSV"

## Project Timeline

- **Week 1**: Dataset creation and labeling
- **Week 2**: Keyword filter implementation
- **Week 3**: AI classifier implementation
- **Week 4**: Frontend development
- **Week 5**: Integration and testing
- **Week 6**: Documentation and refinement

## Resources

- scikit-learn: https://scikit-learn.org
- pandas: https://pandas.pydata.org
- Chart.js: https://www.chartjs.org
- Regular Expressions: https://regex101.com

## Future Enhancements

1. Deep Learning Models
   - Fine-tune BERT or DistilBERT
   - Transfer learning from similar datasets

2. Real-time Processing
   - WebSocket for live message filtering
   - Batch processing optimization

3. Advanced Features
   - Auto-reply suggestions
   - Faculty feedback loop for model improvement
   - Multi-language support

4. Analytics
   - Message trend analysis
   - Faculty usage patterns
   - Model performance trends

## Support & Contact

Supervisor: Saima Jamil
- Email: saima.jamil@vu.edu.pk
- MS Teams: saima.jamil1988@outlook.com
