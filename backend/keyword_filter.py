#!/usr/bin/env python3
"""
Keyword-Based Filtering Module
Implements regex-based non-academic message detection
"""

import re
from typing import Dict, List, Tuple
import json


class KeywordFilter:
    def __init__(self):
        """Initialize keyword filter with predefined patterns"""
        self.patterns = {
            'greeting': r'\b(hi|hello|hey|assalam|greeting|salaam)\b',
            'affirmation': r'\b(good|ok|okay|done|yes|sure|agreed|fine|great|awesome|perfect)\b',
            'presence': r'\b(present|present sir|here|i am here|attendance|buakhair)\b',
            'irrelevant': r'\b(thanks|thankyou|thanks for|appreciated|done|will do)\b',
            'phone_number': r'(\+92|0)?3\d{2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}|[0-9]{10,}',
            'whatsapp': r'whatsapp|whats app|wa|group link|group code',
            'url': r'https?://[^\s]+',
        }
        self.custom_keywords = []

    def add_custom_keyword(self, keyword: str):
        """Add custom keyword for filtering"""
        if keyword not in self.custom_keywords:
            self.custom_keywords.append(keyword)

    def classify(self, message: str) -> Dict:
        """
        Classify message based on keyword patterns
        
        Args:
            message: Text to classify
            
        Returns:
            Dictionary with classification result and metadata
        """
        result = {
            'is_non_academic': False,
            'score': 0.0,
            'matched_patterns': [],
            'confidence': 0.0,
        }

        if not message or len(message.strip()) == 0:
            return result

        text = message.lower()
        match_count = 0
        total_patterns = len(self.patterns) + len(self.custom_keywords)

        # Check built-in patterns
        for pattern_name, pattern in self.patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                match_count += 1
                result['matched_patterns'].append({
                    'pattern': pattern_name,
                    'matches': matches,
                    'count': len(matches),
                })

        # Check custom keywords
        for keyword in self.custom_keywords:
            keyword_regex = rf'\b{re.escape(keyword)}\b'
            matches = re.findall(keyword_regex, text, re.IGNORECASE)
            if matches:
                match_count += 1
                result['matched_patterns'].append({
                    'pattern': f'custom_{keyword}',
                    'matches': matches,
                    'count': len(matches),
                })

        # Calculate scores
        if total_patterns > 0:
            result['score'] = match_count / total_patterns
            result['confidence'] = self._calculate_confidence(message, match_count)

        # Determine if non-academic
        result['is_non_academic'] = result['score'] >= 0.5

        return result

    def _calculate_confidence(self, message: str, match_count: int) -> float:
        """Calculate confidence score based on message characteristics"""
        confidence = 0.0

        # Length consideration
        word_count = len(message.split())
        if word_count <= 5:
            confidence += 0.2
        elif word_count > 20:
            confidence -= 0.1

        # Match count consideration
        if match_count > 3:
            confidence += 0.3
        elif match_count > 1:
            confidence += 0.2
        elif match_count > 0:
            confidence += 0.1

        # Phone number detection
        if re.search(self.patterns['phone_number'], message):
            confidence += 0.4

        # URL detection
        if re.search(self.patterns['url'], message):
            confidence += 0.2

        return min(confidence, 1.0)

    def classify_batch(self, messages: List[str]) -> List[Dict]:
        """Classify multiple messages at once"""
        return [self.classify(msg) for msg in messages]

    def get_statistics(self, messages: List[str]) -> Dict:
        """Get statistics on message classifications"""
        stats = {
            'total_messages': len(messages),
            'non_academic_count': 0,
            'academic_count': 0,
            'average_score': 0.0,
            'common_patterns': {},
        }

        total_score = 0
        for message in messages:
            result = self.classify(message)

            if result['is_non_academic']:
                stats['non_academic_count'] += 1
            else:
                stats['academic_count'] += 1

            total_score += result['score']

            for pattern in result['matched_patterns']:
                pattern_name = pattern['pattern']
                stats['common_patterns'][pattern_name] = \
                    stats['common_patterns'].get(pattern_name, 0) + 1

        if len(messages) > 0:
            stats['average_score'] = total_score / len(messages)

        return stats


if __name__ == '__main__':
    # Example usage
    filter_obj = KeywordFilter()

    test_messages = [
        "I found the reference material helpful",
        "Good",
        "Done",
        "03215647890",
        "Can someone explain the methodology?",
        "Thanks for sharing",
    ]

    print("Testing Keyword Filter:")
    for msg in test_messages:
        result = filter_obj.classify(msg)
        print(f"\nMessage: {msg}")
        print(f"Classification: {'Non-Academic' if result['is_non_academic'] else 'Academic'}")
        print(f"Score: {result['score']:.2f}")
        print(f"Matched Patterns: {result['matched_patterns']}")

    # Statistics
    stats = filter_obj.get_statistics(test_messages)
    print("\n\nStatistics:")
    print(json.dumps(stats, indent=2))
