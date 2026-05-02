#!/usr/bin/env python3
"""
Data Processing and Utilities
Handles dataset loading, preprocessing, and analysis
"""

import csv
import json
from typing import List, Dict, Tuple
import pandas as pd
from pathlib import Path


class DataProcessor:
    def __init__(self):
        """Initialize data processor"""
        self.messages = []
        self.labels = []

    def load_csv(self, filepath: str) -> List[Dict]:
        """
        Load messages from CSV file
        
        Args:
            filepath: Path to CSV file with 'message' and 'label' columns
            
        Returns:
            List of message dictionaries
        """
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    data.append({
                        'message': row.get('message', ''),
                        'label': row.get('label', 'unknown'),
                    })
            self.messages = [d['message'] for d in data]
            self.labels = [d['label'] for d in data]
            print(f"Loaded {len(data)} messages from {filepath}")
        except Exception as e:
            print(f"Error loading CSV: {e}")

        return data

    def load_json(self, filepath: str) -> List[Dict]:
        """
        Load messages from JSON file
        
        Args:
            filepath: Path to JSON file
            
        Returns:
            List of message dictionaries
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    self.messages = [d.get('message', '') for d in data]
                    self.labels = [d.get('label', 'unknown') for d in data]
                    print(f"Loaded {len(data)} messages from {filepath}")
                    return data
        except Exception as e:
            print(f"Error loading JSON: {e}")

        return []

    def save_csv(self, filepath: str, data: List[Dict]):
        """
        Save messages to CSV file
        
        Args:
            filepath: Path to save CSV file
            data: List of message dictionaries
        """
        try:
            if not data:
                print("No data to save")
                return

            keys = data[0].keys()
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(data)
            print(f"Saved {len(data)} messages to {filepath}")
        except Exception as e:
            print(f"Error saving CSV: {e}")

    def save_json(self, filepath: str, data: List[Dict]):
        """Save messages to JSON file"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(data)} messages to {filepath}")
        except Exception as e:
            print(f"Error saving JSON: {e}")

    def get_statistics(self) -> Dict:
        """Get dataset statistics"""
        if not self.labels:
            return {}

        label_counts = {}
        for label in self.labels:
            label_counts[label] = label_counts.get(label, 0) + 1

        avg_length = sum(len(msg.split()) for msg in self.messages) / len(self.messages) if self.messages else 0

        return {
            'total_messages': len(self.messages),
            'label_distribution': label_counts,
            'average_message_length': avg_length,
            'unique_labels': list(set(self.labels)),
        }

    def split_train_test(self, test_size: float = 0.2) -> Tuple[List, List, List, List]:
        """
        Split data into train and test sets
        
        Args:
            test_size: Proportion of test set (0.0-1.0)
            
        Returns:
            Tuple of (train_messages, test_messages, train_labels, test_labels)
        """
        if not self.messages or not self.labels:
            return [], [], [], []

        n = len(self.messages)
        split_idx = int(n * (1 - test_size))

        return (
            self.messages[:split_idx],
            self.messages[split_idx:],
            self.labels[:split_idx],
            self.labels[split_idx:],
        )

    def clean_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove extra whitespace
        text = ' '.join(text.split())
        # Remove special characters but keep basic punctuation
        text = ''.join(c for c in text if c.isalnum() or c in ' ,.!?-')
        return text.strip()

    def filter_by_label(self, label: str) -> List[str]:
        """Get all messages with specific label"""
        return [msg for msg, lbl in zip(self.messages, self.labels) if lbl == label]


class PerformanceAnalyzer:
    @staticmethod
    def compare_classifiers(keyword_results: List[Dict], ai_results: List[Dict], 
                           true_labels: List[str]) -> Dict:
        """
        Compare performance of keyword and AI classifiers
        
        Args:
            keyword_results: Results from keyword classifier
            ai_results: Results from AI classifier
            true_labels: Ground truth labels
            
        Returns:
            Dictionary with comparison metrics
        """
        # Convert results to predictions
        keyword_preds = [1 if r['is_non_academic'] else 0 for r in keyword_results]
        ai_preds = [1 if r['prediction'] == 'non-academic' else 0 for r in ai_results]
        true_preds = [1 if label == 'non-academic' else 0 for label in true_labels]

        # Calculate agreement
        agreement = sum(1 for k, a in zip(keyword_preds, ai_preds) if k == a) / len(keyword_preds)

        # Find disagreements
        disagreements = [
            {
                'message': keyword_results[i].get('message', ''),
                'keyword': keyword_preds[i],
                'ai': ai_preds[i],
                'true': true_preds[i],
            }
            for i in range(len(keyword_preds))
            if keyword_preds[i] != ai_preds[i]
        ]

        return {
            'agreement': agreement,
            'disagreements': disagreements,
            'disagreement_count': len(disagreements),
        }


if __name__ == '__main__':
    # Example usage
    processor = DataProcessor()
    processor.load_csv('dataset/sample_labeled_messages.csv')
    
    stats = processor.get_statistics()
    print("Dataset Statistics:")
    print(json.dumps(stats, indent=2))

    train_msgs, test_msgs, train_labels, test_labels = processor.split_train_test(0.2)
    print(f"\nTrain set: {len(train_msgs)} messages")
    print(f"Test set: {len(test_msgs)} messages")
