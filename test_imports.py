#!/usr/bin/env python3
"""Test script to verify imports"""

import sys
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")

try:
    print("\n[1] Testing scikit-learn...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    print("✓ scikit-learn imported successfully")
except ImportError as e:
    print(f"✗ Error importing scikit-learn: {e}")

try:
    print("\n[2] Testing pandas...")
    import pandas as pd
    print("✓ pandas imported successfully")
except ImportError as e:
    print(f"✗ Error importing pandas: {e}")

try:
    print("\n[3] Testing keyword_filter module...")
    from backend.keyword_filter import KeywordFilter
    print("✓ KeywordFilter imported successfully")
except ImportError as e:
    print(f"✗ Error importing KeywordFilter: {e}")

try:
    print("\n[4] Testing ai_classifier module...")
    from backend.ai_classifier import AIClassifier
    print("✓ AIClassifier imported successfully")
except ImportError as e:
    print(f"✗ Error importing AIClassifier: {e}")

try:
    print("\n[5] Testing data_processor module...")
    from backend.utils.data_processor import DataProcessor
    print("✓ DataProcessor imported successfully")
except ImportError as e:
    print(f"✗ Error importing DataProcessor: {e}")

print("\n[DONE] Import test completed!")
