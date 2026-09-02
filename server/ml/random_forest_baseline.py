"""
AgriSmart — Machine Learning Baseline Script
Model: Random Forest Classifier (100 Estimators, Gini Impurity)
Dataset: server/data/nepal_crop_recommendation.csv (2,200 Rows)
Purpose: Offline ML benchmark to evaluate tabular crop suitability & feature importances.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report

def run_random_forest_baseline():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "data", "nepal_crop_recommendation.csv")

    if not os.path.exists(data_path):
        data_path = os.path.join(base_dir, "..", "data", "kaggle_crop_recommendation_full.csv")

    print(f"[*] Loading dataset: {os.path.relpath(data_path, base_dir)}")
    df = pd.read_csv(data_path)
    print(f"    Samples: {len(df)} rows across {df['label'].nunique()} crop classes.")

    feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[feature_cols]
    y_raw = df['label']

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    # 80/20 Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[*] Train/Test Split: 80% Train ({len(X_train)} samples), 20% Test ({len(X_test)} samples)")

    # Train Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, criterion='gini', max_depth=16, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    # Predictions & Evaluation
    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')

    print(f"[*] Random Forest Test Accuracy : {acc * 100:.2f}%")
    print(f"[*] Macro Precision            : {prec:.4f}")
    print(f"[*] Macro Recall               : {rec:.4f}")
    print(f"[*] Macro F1-Score             : {f1:.4f}")

    # 5-Fold Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv = cross_val_score(rf, X, y, cv=skf, scoring='accuracy')
    print(f"[*] 5-Fold Cross-Validation    : Mean {cv.mean() * 100:.2f}% (+/- {cv.std() * 100:.2f}%)")

    # Feature Importance
    print("\n[*] Feature Importance Ranking:")
    importances = dict(zip(feature_cols, rf.feature_importances_))
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {feat:12}: {imp * 100:.2f}%")

    print("\n[OK] Baseline Random Forest script executed successfully.")

if __name__ == "__main__":
    run_random_forest_baseline()
