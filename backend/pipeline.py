#!/usr/bin/env python3
"""
Main Pipeline Script
Complete workflow for training, evaluating, and comparing classifiers
"""

import os
import json
import argparse
from backend.keyword_filter import KeywordFilter
from backend.ai_classifier import AIClassifier
from backend.utils.data_processor import DataProcessor, PerformanceAnalyzer


def train_pipeline(dataset_path, output_dir='models'):
    """
    Complete training pipeline
    
    Args:
        dataset_path: Path to labeled dataset CSV
        output_dir: Directory to save trained models
    """
    print("=" * 60)
    print("MDB FILTERING TOOL - TRAINING PIPELINE")
    print("=" * 60)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Load data
    print("\n[1/4] Loading dataset...")
    processor = DataProcessor()
    processor.load_csv(dataset_path)

    stats = processor.get_statistics()
    print(f"  - Total messages: {stats['total_messages']}")
    print(f"  - Label distribution: {stats['label_distribution']}")
    print(f"  - Average message length: {stats['average_message_length']:.1f} words")

    # Split data
    print("\n[2/4] Splitting data (80/20)...")
    train_msgs, test_msgs, train_labels, test_labels = processor.split_train_test(0.2)
    print(f"  - Training set: {len(train_msgs)} messages")
    print(f"  - Test set: {len(test_msgs)} messages")

    # Train keyword filter
    print("\n[3/4] Training Keyword Filter...")
    keyword_filter = KeywordFilter()
    keyword_results = keyword_filter.classify_batch(test_msgs)
    keyword_stats = keyword_filter.get_statistics(test_msgs)
    print(f"  - Non-academic detected: {keyword_stats['non_academic_count']}")
    print(f"  - Academic detected: {keyword_stats['academic_count']}")
    print(f"  - Average score: {keyword_stats['average_score']:.3f}")

    # Train AI classifier
    print("\n[4/4] Training AI Classifier (Logistic Regression)...")
    classifier = AIClassifier('logistic_regression')
    train_metrics = classifier.train(train_msgs, train_labels)
    print(f"  - Training accuracy: {train_metrics['accuracy']:.3f}")
    print(f"  - Training precision: {train_metrics['precision']:.3f}")

    # Evaluate on test set
    test_metrics = classifier.evaluate(test_msgs, test_labels)
    print(f"  - Test accuracy: {test_metrics['accuracy']:.3f}")
    print(f"  - Test precision: {test_metrics['precision']:.3f}")
    print(f"  - Test recall: {test_metrics['recall']:.3f}")
    print(f"  - Test F1-score: {test_metrics['f1_score']:.3f}")

    # Save model
    model_path = os.path.join(output_dir, 'ai_classifier.joblib')
    classifier.save_model(model_path)
    print(f"  - Model saved to {model_path}")

    # Get predictions for comparison
    print("\n[Comparison] Making predictions on test set...")
    ai_predictions = classifier.predict(test_msgs)

    # Prepare keyword results for comparison
    keyword_predictions = [
        {
            'message': msg,
            'prediction': 'non-academic' if result['is_non_academic'] else 'academic',
            'confidence': result['confidence']
        }
        for msg, result in zip(test_msgs, keyword_results)
    ]

    # Compare approaches
    comparison = PerformanceAnalyzer.compare_classifiers(
        keyword_results, ai_predictions, test_labels
    )

    print(f"\nClassifier Agreement: {comparison['agreement']:.1%}")
    print(f"Disagreements: {comparison['disagreement_count']} messages")

    # Save results
    results = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'dataset': {
            'total_messages': stats['total_messages'],
            'distribution': stats['label_distribution'],
        },
        'keyword_filter': {
            'statistics': keyword_stats,
        },
        'ai_classifier': {
            'training_metrics': train_metrics,
            'test_metrics': test_metrics,
            'model_type': classifier.model_type,
        },
        'comparison': {
            'agreement': comparison['agreement'],
            'disagreement_count': comparison['disagreement_count'],
        },
    }

    results_path = os.path.join(output_dir, 'results.json')
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to {results_path}")
    print("=" * 60)

    return results


def classify_messages(model_path, messages):
    """
    Classify messages using trained model
    
    Args:
        model_path: Path to trained model
        messages: List of messages to classify
    """
    print("\n" + "=" * 60)
    print("CLASSIFICATION")
    print("=" * 60)

    # Load model
    classifier = AIClassifier()
    classifier.load_model(model_path)

    # Classify messages
    predictions = classifier.predict(messages)

    # Keyword filtering
    keyword_filter = KeywordFilter()
    keyword_results = keyword_filter.classify_batch(messages)

    # Display results
    for i, (ai_pred, kw_result) in enumerate(zip(predictions, keyword_results)):
        print(f"\n[{i+1}] {messages[i][:50]}...")
        print(f"    Keyword: {kw_result['is_non_academic'] and 'Non-Academic' or 'Academic'} "
              f"(confidence: {kw_result['confidence']:.2f})")
        print(f"    AI:      {ai_pred['prediction'].capitalize()} "
              f"(confidence: {ai_pred['confidence']:.2f})")

    print("\n" + "=" * 60)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='MDB Filtering Tool Pipeline')
    parser.add_argument('--train', action='store_true', help='Train models')
    parser.add_argument('--dataset', type=str, default='dataset/sample_labeled_messages.csv',
                        help='Path to dataset CSV')
    parser.add_argument('--output', type=str, default='models',
                        help='Output directory for models')
    parser.add_argument('--classify', action='store_true', help='Classify messages')
    parser.add_argument('--model', type=str, default='models/ai_classifier.joblib',
                        help='Path to trained model')
    parser.add_argument('--messages', type=str, nargs='+',
                        help='Messages to classify')

    args = parser.parse_args()

    if args.train:
        train_pipeline(args.dataset, args.output)

    if args.classify:
        if not args.messages:
            print("Please provide messages using --messages")
        else:
            classify_messages(args.model, args.messages)

    if not args.train and not args.classify:
        print("Please specify --train or --classify")
