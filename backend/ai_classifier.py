#!/usr/bin/env python3
"""
AI-Based Classification Module
Implements ML-based message classification using scikit-learn
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, List, Tuple
import joblib
import json


class AIClassifier:
    def __init__(self, model_type='logistic_regression'):
        """
        Initialize AI classifier
        
        Args:
            model_type: 'logistic_regression' or 'naive_bayes'
        """
        self.model_type = model_type
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            min_df=1,
            max_df=0.8,
            ngram_range=(1, 2),
            stop_words='english'
        )

        if model_type == 'logistic_regression':
            self.model = LogisticRegression(random_state=42, max_iter=1000)
        elif model_type == 'naive_bayes':
            self.model = MultinomialNB()
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        self.is_trained = False
        self.label_encoder = {'academic': 1, 'non-academic': 0}

    def train(self, messages: List[str], labels: List[str]) -> Dict:
        """
        Train the classifier
        
        Args:
            messages: List of message texts
            labels: List of labels ('academic' or 'non-academic')
            
        Returns:
            Dictionary with training metrics
        """
        # Convert labels to numeric
        y = np.array([self.label_encoder[label] for label in labels])

        # Vectorize messages
        X = self.vectorizer.fit_transform(messages)

        # Train model
        self.model.fit(X, y)
        self.is_trained = True

        # Get training accuracy
        y_pred = self.model.predict(X)
        metrics = {
            'accuracy': accuracy_score(y, y_pred),
            'precision': precision_score(y, y_pred, zero_division=0),
            'recall': recall_score(y, y_pred, zero_division=0),
            'f1_score': f1_score(y, y_pred, zero_division=0),
        }

        return metrics

    def predict(self, messages: List[str]) -> List[Dict]:
        """
        Predict labels for messages
        
        Args:
            messages: List of message texts
            
        Returns:
            List of predictions with confidence scores
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")

        X = self.vectorizer.transform(messages)
        predictions = self.model.predict(X)

        # Get probabilities if available
        if hasattr(self.model, 'predict_proba'):
            probabilities = self.model.predict_proba(X)
        else:
            probabilities = None

        results = []
        for i, pred in enumerate(predictions):
            label = 'academic' if pred == 1 else 'non-academic'
            confidence = 0.5

            if probabilities is not None:
                confidence = max(probabilities[i])

            results.append({
                'message': messages[i],
                'prediction': label,
                'confidence': float(confidence),
            })

        return results

    def evaluate(self, messages: List[str], labels: List[str]) -> Dict:
        """
        Evaluate classifier on test set
        
        Args:
            messages: List of message texts
            labels: List of true labels
            
        Returns:
            Dictionary with evaluation metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")

        y_true = np.array([self.label_encoder[label] for label in labels])
        X = self.vectorizer.transform(messages)
        y_pred = self.model.predict(X)

        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1_score': f1_score(y_true, y_pred, zero_division=0),
        }

        return metrics

    def save_model(self, filepath: str):
        """Save trained model to disk"""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")

        model_data = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'model_type': self.model_type,
            'label_encoder': self.label_encoder,
        }

        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")

    def load_model(self, filepath: str):
        """Load trained model from disk"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.vectorizer = model_data['vectorizer']
        self.model_type = model_data['model_type']
        self.label_encoder = model_data['label_encoder']
        self.is_trained = True
        print(f"Model loaded from {filepath}")

    def get_feature_importance(self, top_n: int = 10) -> List[Tuple]:
        """
        Get most important features for the model
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            List of (feature, importance) tuples
        """
        if not self.is_trained or self.model_type != 'logistic_regression':
            return []

        feature_names = np.array(self.vectorizer.get_feature_names_out())
        coefficients = self.model.coef_[0]

        # Get top positive (academic) and negative (non-academic) coefficients
        top_indices = np.argsort(np.abs(coefficients))[-top_n:]
        top_features = [(feature_names[i], coefficients[i]) for i in top_indices]

        return sorted(top_features, key=lambda x: abs(x[1]), reverse=True)


if __name__ == '__main__':
    # Example usage
    messages = [
        "I found the reference material helpful",
        "Good",
        "Done",
        "The algorithm needs optimization",
        "Thanks for sharing",
        "Can someone help me understand this concept?",
    ]

    labels = [
        "academic",
        "non-academic",
        "non-academic",
        "academic",
        "non-academic",
        "academic",
    ]

    # Train classifier
    classifier = AIClassifier('logistic_regression')
    metrics = classifier.train(messages, labels)

    print("Training Metrics:")
    print(json.dumps(metrics, indent=2))

    # Make predictions
    test_messages = [
        "I need clarification on the methodology",
        "ok",
    ]

    predictions = classifier.predict(test_messages)
    print("\nPredictions:")
    print(json.dumps(predictions, indent=2))

    # Feature importance
    print("\nTop Features:")
    features = classifier.get_feature_importance(5)
    for feature, importance in features:
        print(f"  {feature}: {importance:.4f}")
