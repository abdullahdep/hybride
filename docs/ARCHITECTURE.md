# Project Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Mock MDB UI │  │  Comparison  │  │  Export Module     │ │
│  │ (HTML/CSS)  │  │  Dashboard   │  │  (CSV/JSON/TXT)    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│         ↓                ↓                      ↓             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              JavaScript Controllers                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ UI Handler   │  │ Keyword Filt │  │   Config     │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Classification Pipeline                      │   │
│  │  ┌────────────┐      ┌─────────────┐      ┌──────┐  │   │
│  │  │  Keyword   │      │    TF-IDF   │      │ Vote │  │   │
│  │  │   Filter   │──┐   │ Vectorizer  │──┐   │ Merge│  │   │
│  │  │  (Regex)   │  │   │             │  │   │      │  │   │
│  │  └────────────┘  │   └─────────────┘  │   └──────┘  │   │
│  │                  │        ↓           │      ↑       │   │
│  │                  │   ┌──────────┐     │      │       │   │
│  │                  └──→│ ML Model  │─────      │       │   │
│  │                      │(LR/NB)   │           │       │   │
│  │                      └──────────┘           │       │   │
│  │                                             │       │   │
│  │  ┌───────────────────────────────────────────      │   │
│  │  │   Performance Metrics Calculator  ← ─ ─ ─ ┘    │   │
│  │  └─────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Raw Data   │  │   Trained   │  │   Classification     │ │
│  │  (CSV/JSON) │  │   Models    │  │     Results          │ │
│  │             │  │  (joblib)   │  │                      │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Components

#### 1. HTML/CSS Structure (`frontend/index.html`, `frontend/css/`)
- Responsive layout with sidebar and main content area
- Message card component for displaying individual messages
- Modal for metrics comparison
- Statistics panel for real-time counts

#### 2. JavaScript Modules (`frontend/js/`)

**config.js**
- Centralized configuration
- Keyword patterns for regex filtering
- Threshold settings
- API endpoints

**keyword-filter.js**
- Client-side keyword filtering
- Pattern matching with confidence scoring
- Custom keyword management
- Batch processing

**data-loader.js**
- Demo data generation
- Message classification orchestration
- Metrics calculation
- Misclassified example identification

**ui-controller.js**
- Event handling and DOM manipulation
- Modal management
- Dynamic rendering of messages
- Statistics updates

**export.js**
- CSV export with formatting
- JSON export with metadata
- Text report generation
- Download functionality

### Backend Components

#### 1. Keyword Filter (`backend/keyword_filter.py`)
- Regex-based pattern matching
- Multiple pattern categories
- Confidence scoring algorithm
- Custom keyword support
- Batch processing

#### 2. AI Classifier (`backend/ai_classifier.py`)
- TF-IDF vectorization
- Multiple model support (Logistic Regression, Naive Bayes)
- Model training and evaluation
- Feature importance extraction
- Model persistence (save/load)

#### 3. Data Processing (`backend/utils/data_processor.py`)
- CSV/JSON file I/O
- Dataset statistics
- Train/test splitting
- Text preprocessing
- Performance analysis and comparison

### Data Structure

#### Message Object
```json
{
    "id": 1,
    "author": "Ahmed Khan",
    "message": "I found this helpful",
    "timestamp": "2025-04-29 10:30",
    "actualLabel": "academic",
    "keywordClassification": "academic",
    "keywordScore": 0.2,
    "keywordPatterns": [],
    "aiClassification": "academic",
    "aiConfidence": 0.85,
    "classification": "academic"
}
```

#### Classification Result
```json
{
    "message": "Good",
    "is_non_academic": true,
    "score": 0.75,
    "confidence": 0.92,
    "matched_patterns": [
        {
            "pattern": "affirmation",
            "matches": ["Good"],
            "count": 1
        }
    ]
}
```

#### Performance Metrics
```json
{
    "keyword_metrics": {
        "accuracy": 0.82,
        "precision": 0.85,
        "recall": 0.78,
        "f1_score": 0.81
    },
    "ai_metrics": {
        "accuracy": 0.88,
        "precision": 0.90,
        "recall": 0.85,
        "f1_score": 0.87
    }
}
```

## Data Flow

### Filtering Pipeline

1. **Input**: Raw message text
2. **Keyword Stage**:
   - Apply regex patterns
   - Calculate match score
   - Compute confidence
   - Return classification

3. **AI Stage**:
   - Vectorize text (TF-IDF)
   - Pass through trained model
   - Get prediction and probability
   - Return classification

4. **Aggregation**:
   - Combine results (voting)
   - Final classification decision
   - Prepare display metadata

5. **Output**: Classified message with metadata

### Evaluation Pipeline

1. Load labeled test set
2. Run both classifiers
3. Compare predictions with ground truth
4. Calculate metrics:
   - Accuracy
   - Precision
   - Recall
   - F1-Score
5. Generate comparison report
6. Identify disagreements and misclassifications

## Key Algorithms

### Keyword Filtering Algorithm

```
For each message:
    1. Initialize: score = 0, matched_patterns = []
    2. For each pattern in patterns:
        a. Check if pattern matches message
        b. If match: increment match count
        c. Record matched pattern
    3. Calculate score = matches / total_patterns
    4. Calculate confidence based on:
        - Message length
        - Number of matches
        - Special indicators (phone, URL)
    5. Determine: is_non_academic = score > threshold
    6. Return classification result
```

### AI Classification Algorithm

```
Training Phase:
    1. Load labeled dataset
    2. Vectorize messages using TF-IDF
    3. Train model on labeled data
    4. Evaluate on validation set
    5. Save model and vectorizer

Classification Phase:
    1. Vectorize new message
    2. Pass through trained model
    3. Get prediction and probability
    4. Return classification with confidence
```

### Confidence Calculation

```
confidence = 0.0
if message_length <= 5:
    confidence += 0.2  (short messages likely non-academic)
if match_count > 3:
    confidence += 0.3
elif match_count > 1:
    confidence += 0.2
if phone_number_detected:
    confidence += 0.4
if url_detected:
    confidence += 0.2
confidence = min(confidence, 1.0)
```

## Performance Considerations

### Time Complexity
- **Keyword Filtering**: O(n*m) where n = message length, m = pattern count
- **AI Classification**: O(n) for inference after vectorization

### Space Complexity
- **Keyword Filter**: O(p) where p = number of patterns
- **AI Model**: O(v*f) where v = vocabulary size, f = feature count

### Optimization Strategies
1. Batch processing for multiple messages
2. Pattern caching for repeated filtering
3. Model quantization for faster inference
4. Lazy loading of heavy resources

## Security Considerations

1. Input Validation
   - Sanitize user inputs
   - Prevent injection attacks
   - Validate file uploads

2. Data Privacy
   - Do not store sensitive information
   - Clear sensitive data after processing
   - HTTPS for any remote communication

3. Model Safety
   - Validate model predictions
   - Confidence thresholds for uncertain cases
   - Regular model validation
