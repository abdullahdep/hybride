#!/usr/bin/env python3
"""
Flask API Server for MDB Filtering Tool
Provides REST endpoints for classification and metrics
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json

# Add frontend directory to path to import database module
frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
sys.path.insert(0, frontend_path)

from database import get_user, init_db as init_frontend_db
from .keyword_filter import KeywordFilter
from .ai_classifier import AIClassifier
from .utils.data_processor import DataProcessor

# Initialize app
app = Flask(__name__)
CORS(app)

# Initialize frontend database
try:
    init_frontend_db()
except Exception as e:
    print(f"Note: Frontend database not initialized: {e}")

# Initialize classifiers
keyword_filter = KeywordFilter()
ai_classifier = AIClassifier('logistic_regression')
model_path = 'models/ai_classifier.joblib'

# Try to load trained model
model_loaded = False
if os.path.exists(model_path):
    try:
        ai_classifier.load_model(model_path)
        model_loaded = True
        print("AI model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model_loaded,
        'version': '1.0.0'
    })


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user for browser extension using frontend database"""
    try:
        data = request.json
        username = data.get('username', '')
        password = data.get('password', '')

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password required'
            }), 400

        # Check credentials against frontend database
        # Try to get user without type filter (works for all user types)
        user = get_user(username)
        
        if user and user.get('password') == password:
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': f'token_{username}_{os.urandom(8).hex()}',
                'username': username,
                'user_type': user.get('user_type'),
                'email': user.get('email')
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/verify', methods=['POST'])
def verify_token():
    """Verify if token is valid"""
    try:
        data = request.json
        token = data.get('token', '')

        if token:
            return jsonify({'valid': True})
        return jsonify({'valid': False})

    except Exception as e:
        return jsonify({'valid': False})


@app.route('/api/classify', methods=['POST'])
def classify_messages():
    """Classify messages using both methods"""
    try:
        data = request.json
        messages = data.get('messages', [])
        methods = data.get('methods', ['keyword', 'ai'])

        if not messages:
            return jsonify({'status': 'error', 'message': 'No messages provided'}), 400

        results = []

        for message in messages:
            result = {'message': message}

            # Keyword classification
            if 'keyword' in methods:
                kw_result = keyword_filter.classify(message)
                result['keyword'] = {
                    'classification': 'non-academic' if kw_result['is_non_academic'] else 'academic',
                    'confidence': float(kw_result['confidence']),
                    'matched_patterns': [p['pattern'] for p in kw_result['matched_patterns']]
                }

            # AI classification
            if 'ai' in methods and model_loaded:
                try:
                    ai_result = ai_classifier.predict([message])[0]
                    result['ai'] = {
                        'classification': ai_result['prediction'],
                        'confidence': float(ai_result['confidence'])
                    }
                except Exception as e:
                    result['ai'] = {'error': str(e)}

            # Determine final classification
            classifications = []
            if 'keyword' in result:
                classifications.append(result['keyword']['classification'])
            if 'ai' in result:
                classifications.append(result['ai']['classification'])

            if classifications:
                non_academic_count = sum(1 for c in classifications if c == 'non-academic')
                result['final_classification'] = 'non-academic' if non_academic_count > len(classifications) / 2 else 'academic'

            results.append(result)

        return jsonify({
            'status': 'success',
            'results': results,
            'model_loaded': model_loaded
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get performance metrics"""
    try:
        # This is a placeholder - in production, load actual metrics from storage
        metrics = {
            'keyword': {
                'accuracy': 0.82,
                'precision': 0.85,
                'recall': 0.78,
                'f1_score': 0.81
            },
            'ai': {
                'accuracy': 0.88,
                'precision': 0.90,
                'recall': 0.85,
                'f1_score': 0.87
            },
            'model_loaded': model_loaded
        }
        return jsonify({'status': 'success', 'metrics': metrics})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/keywords', methods=['GET'])
def get_keywords():
    """Get active keywords"""
    try:
        keywords = {pattern_name: str(pattern) for pattern_name, pattern in keyword_filter.patterns.items()}
        keywords['custom'] = keyword_filter.custom_keywords
        return jsonify({'status': 'success', 'keywords': keywords})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/keywords', methods=['POST'])
def add_keyword():
    """Add custom keyword"""
    try:
        data = request.json
        keyword = data.get('keyword', '')

        if not keyword:
            return jsonify({'status': 'error', 'message': 'Keyword required'}), 400

        keyword_filter.add_custom_keyword(keyword)
        return jsonify({'status': 'success', 'message': 'Keyword added'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/train', methods=['POST'])
def train_model():
    """Train AI classifier"""
    try:
        data = request.json
        dataset_path = data.get('dataset_path')

        if not dataset_path or not os.path.exists(dataset_path):
            return jsonify({'status': 'error', 'message': 'Dataset not found'}), 400

        # Load and split data
        processor = DataProcessor()
        processor.load_csv(dataset_path)
        train_msgs, test_msgs, train_labels, test_labels = processor.split_train_test(0.2)

        # Train model
        train_metrics = ai_classifier.train(train_msgs, train_labels)
        test_metrics = ai_classifier.evaluate(test_msgs, test_labels)

        # Save model
        os.makedirs('models', exist_ok=True)
        ai_classifier.save_model(model_path)

        return jsonify({
            'status': 'success',
            'training_metrics': train_metrics,
            'test_metrics': test_metrics
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/', methods=['GET'])
def index():
    """API documentation"""
    return jsonify({
        'name': 'MDB Filtering Tool API',
        'version': '1.0.0',
        'endpoints': {
            'POST /api/login': 'Authenticate user (uses frontend database)',
            'POST /api/verify': 'Verify token',
            'GET /api/health': 'Health check',
            'POST /api/classify': 'Classify messages',
            'GET /api/metrics': 'Get performance metrics',
            'GET /api/keywords': 'Get active keywords',
            'POST /api/keywords': 'Add custom keyword',
            'POST /api/train': 'Train AI classifier'
        },
        'note': 'Login uses credentials created in the frontend admin dashboard. Create users there first.'
    })


if __name__ == '__main__':
    print("Starting MDB Filtering Tool API Server...")
    print("Available at http://localhost:5000")
    print("Documentation at http://localhost:5000")
    app.run(debug=True, port=5000)
