# Hybrid MDB Filtering Tool

## Project Overview
A browser-based tool designed to automatically detect, filter, and manage non-academic messages in Virtual University's Moderated Discussion Board (MDB). The solution improves faculty productivity by reducing manual review of cluttered posts.

## Features
- **Dual Filtering System**: Keyword-based (regex) and AI-powered (ML) classification
- **Performance Metrics**: Compare accuracy across both approaches
- **Mock LMS Interface**: Simulate MDB environment for testing
- **Export Functionality**: Export filtered academic messages to CSV
- **Browser Extension**: Integrate with LMS front-end seamlessly

## Project Structure
```
hybride/
├── frontend/              # HTML/JS/CSS interface
│   ├── js/              # JavaScript modules
│   ├── css/             # Stylesheets
│   ├── assets/          # Images and resources
│   └── index.html       # Mock MDB interface
├── backend/             # Python ML pipeline
│   ├── models/          # ML model implementations
│   ├── utils/           # Helper utilities
│   └── classifiers.py   # Main classification logic
├── browser-extension/   # Tampermonkey/Chrome extension
├── dataset/             # Message datasets
├── docs/                # Documentation
└── requirements.txt     # Python dependencies
```

## Requirements

### Python Dependencies
- scikit-learn
- pandas
- numpy
- Flask (optional, for API)
- spaCy (optional, for NLP)

### Browser Requirements
- Modern browser with JavaScript support
- Tampermonkey or Chrome for extension deployment

### Python Version
Python 3.8 or higher

## Installation

### 1. Clone/Setup Repository
```bash
cd hybride
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Dataset Preparation
Place labeled CSV files in the `dataset/` folder with columns:
- `message`: Text content
- `label`: 0 (non-academic) or 1 (academic)

### 4. Frontend Setup
No build process required. Serve the `frontend/` folder with a local HTTP server:
```bash
python -m http.server 8000 --directory frontend
```

## Usage

### Train ML Models
```bash
python backend/classifiers.py --train --dataset dataset/labeled_messages.csv
```

### Classify Messages
```bash
python backend/classifiers.py --classify --input dataset/test_messages.csv
```

### Access Mock MDB
1. Start the HTTP server
2. Navigate to `http://localhost:8000`
3. Messages will be filtered using both keyword and AI methods

## Components

### Frontend
- Mock MDB interface with message display
- Filter control panel (keyword/AI toggle)
- Comparison dashboard with metrics
- Export feature (CSV/TXT)

### Backend
- **Keyword Filtering**: Regex-based patterns (good, done, present, phone numbers)
- **AI Classification**: TF-IDF + Logistic Regression (with Naive Bayes option)
- **Performance Metrics**: Precision, Recall, F1-Score, Accuracy

### Dataset
- Minimum 500-1000 labeled messages
- Academic vs. non-academic categories
- CSV format with message and label columns

## Performance Metrics

| Metric | Definition |
|--------|-----------|
| Precision | True positives / (True positives + False positives) |
| Recall | True positives / (True positives + False negatives) |
| F1-Score | Harmonic mean of precision and recall |
| Accuracy | Correct predictions / Total predictions |

## Supervisor
**Name**: Saima Jamil  
**Email**: saima.jamil@vu.edu.pk  
**MS Teams**: saima.jamil1988@outlook.com

## Timeline
- Phase 1: Dataset collection and labeling
- Phase 2: Implement keyword and AI classifiers
- Phase 3: Frontend development and integration
- Phase 4: Testing, optimization, and documentation

## Future Enhancements
- Integration with actual VU LMS
- Deep learning models (BERT, DistilBERT)
- Real-time filtering capabilities
- Admin dashboard for keyword management
- Automated reply functionality

## License
Academic Use Only - Virtual University

## Notes
- All data is simulated using mock datasets
- No actual LMS backend access required
- Tool designed for educational demonstration
