#!/usr/bin/env python3
"""
Simplified Pipeline - Works without scikit-learn
Demonstrates keyword filtering and basic metrics
"""

import csv
import json
import re
from pathlib import Path
from collections import defaultdict


class SimpleKeywordFilter:
    """Lightweight keyword filter without ML dependencies"""
    
    def __init__(self):
        self.patterns = {
            'greeting': r'\b(hi|hello|hey|assalam|greeting|salaam)\b',
            'affirmation': r'\b(good|ok|okay|done|yes|sure|agreed|fine)\b',
            'presence': r'\b(present|present sir|here|attendance)\b',
            'phone': r'(\+92|0)?3\d{2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}|[0-9]{10,}',
            'whatsapp': r'whatsapp|whats app|wa|group link',
        }

    def classify(self, message):
        """Classify message as academic or non-academic"""
        if not message or len(message.strip()) == 0:
            return {'classification': 'unknown', 'score': 0, 'patterns': []}

        matches = []
        for pattern_name, pattern in self.patterns.items():
            if re.search(pattern, message, re.IGNORECASE):
                matches.append(pattern_name)

        # Scoring logic
        word_count = len(message.split())
        confidence = 0.0

        # Length heuristic: very short messages are likely non-academic
        if word_count <= 3:
            confidence += 0.4
        
        # Pattern matching
        if len(matches) > 0:
            confidence += 0.3 * len(matches)  # Each match adds weight

        # Special indicators
        if any('phone' in p or 'whatsapp' in p for p in matches):
            confidence += 0.4
        
        confidence = min(confidence, 1.0)
        classification = 'non-academic' if confidence > 0.3 else 'academic'

        return {
            'classification': classification,
            'score': confidence,
            'patterns': matches
        }


def load_dataset(filepath):
    """Load CSV dataset"""
    messages = []
    labels = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                msg = row.get('message', '').strip()
                label = row.get('label', 'unknown').strip()
                if msg:
                    messages.append(msg)
                    labels.append(label)
        return messages, labels
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return [], []


def calculate_metrics(predictions, true_labels):
    """Calculate precision, recall, F1"""
    tp = fp = fn = tn = 0

    for pred, true in zip(predictions, true_labels):
        if pred == 'non-academic' and true == 'non-academic':
            tp += 1
        elif pred == 'non-academic' and true != 'non-academic':
            fp += 1
        elif pred != 'non-academic' and true == 'non-academic':
            fn += 1
        else:
            tn += 1

    total = tp + fp + fn + tn
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'tp': tp,
        'fp': fp,
        'fn': fn,
        'tn': tn,
    }


def main():
    print("=" * 70)
    print("MDB FILTERING TOOL - SIMPLIFIED PIPELINE (Keyword-Based Only)")
    print("=" * 70)

    # Load dataset
    print("\n[1/5] Loading dataset...")
    messages, labels = load_dataset('dataset/sample_labeled_messages.csv')
    
    if not messages:
        print("  ✗ Failed to load dataset")
        return

    print(f"  ✓ Loaded {len(messages)} messages")
    
    # Count labels
    label_dist = defaultdict(int)
    for label in labels:
        label_dist[label] += 1
    
    print(f"  Label distribution: {dict(label_dist)}")

    # Initialize filter
    print("\n[2/5] Initializing Keyword Filter...")
    kw_filter = SimpleKeywordFilter()
    print("  ✓ Filter ready")

    # Classify messages
    print("\n[3/5] Classifying messages...")
    predictions = []
    for msg in messages:
        result = kw_filter.classify(msg)
        predictions.append(result['classification'])

    print(f"  ✓ Classified {len(predictions)} messages")

    # Calculate metrics
    print("\n[4/5] Calculating metrics...")
    metrics = calculate_metrics(predictions, labels)
    
    print(f"  ✓ Metrics calculated")
    print(f"    - Accuracy:  {metrics['accuracy']:.3f}")
    print(f"    - Precision: {metrics['precision']:.3f}")
    print(f"    - Recall:    {metrics['recall']:.3f}")
    print(f"    - F1-Score:  {metrics['f1_score']:.3f}")

    # Detailed classification results
    print("\n[5/5] Classification Results:")
    print("-" * 70)
    
    non_academic_count = 0
    academic_count = 0
    correct = 0
    
    for i, (msg, pred, true) in enumerate(zip(messages, predictions, labels)):
        match = "✓" if pred == true else "✗"
        if pred == true:
            correct += 1
        
        if pred == 'non-academic':
            non_academic_count += 1
        else:
            academic_count += 1
        
        msg_preview = msg[:50] + "..." if len(msg) > 50 else msg
        print(f"{match} [{i+1:2d}] {msg_preview:50s} | Pred: {pred:12s} | True: {true:12s}")

    print("-" * 70)
    print(f"\nSummary:")
    print(f"  - Total messages: {len(messages)}")
    print(f"  - Predicted academic: {academic_count}")
    print(f"  - Predicted non-academic: {non_academic_count}")
    print(f"  - Correct predictions: {correct}/{len(messages)} ({100*correct/len(messages):.1f}%)")

    # Save results
    print("\n[SAVING] Results summary...")
    results = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'dataset_size': len(messages),
        'metrics': metrics,
        'predictions': [
            {
                'message': msg,
                'true_label': true,
                'predicted_label': pred
            }
            for msg, true, pred in zip(messages, labels, predictions)
        ]
    }

    # Create models directory
    Path('models').mkdir(exist_ok=True)
    
    with open('models/results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("  ✓ Results saved to models/results.json")

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == '__main__':
    main()
