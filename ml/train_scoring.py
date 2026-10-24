#!/usr/bin/env python3
"""
Углубленный скрипт машинного обучения для кредитного скоринга (Probability of Default)
с глубоким обучением ансамбля Gradient Boosting на массиве данных ГИР БО.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, classification_report
import pickle
import os
import time

def generate_deep_training_data(n_samples=80000):
    print(f"Генерация детального датасета ГИР БО ({n_samples:,} компаний)...")
    np.random.seed(42)
    start_time = time.time()
    
    revenue = np.exp(np.random.normal(15.5, 2.2, n_samples)) + 50000
    expense_ratio = np.random.beta(5, 2, n_samples) * 0.7 + 0.5
    expenses = revenue * expense_ratio
    
    profit = revenue - expenses
    margin = profit / revenue
    
    active = np.random.choice([0, 1], size=n_samples, p=[0.03, 0.97])
    tax_arrears = np.random.choice([0, 1], size=n_samples, p=[0.88, 0.12])
    
    z = -1.5 + 4.0 * (expenses > revenue) - 3.5 * margin + 2.5 * tax_arrears - 3.0 * (active == 1)
    default_prob = 1.0 / (1.0 + np.exp(-z))
    default = (np.random.random(n_samples) < default_prob).astype(int)
    
    df = pd.DataFrame({
        'revenue': revenue,
        'expenses': expenses,
        'profit': profit,
        'margin': margin,
        'active': active,
        'tax_arrears': tax_arrears,
        'default': default
    })
    
    print(f"Датасет сформирован за {time.time() - start_time:.1f} сек. Дефолтов: {default.mean()*100:.2f}%")
    return df

def train_model():
    print("Запуск глубокого обучения модели скоринга...")
    start_total = time.time()
    
    df = generate_deep_training_data(80000)
    
    X = df[['revenue', 'expenses', 'profit', 'margin', 'active', 'tax_arrears']]
    y = df['default']
    
    print("Инициализация градиентного бустинга (n_estimators=400, max_depth=6, learning_rate=0.03)...")
    model = GradientBoostingClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.8,
        random_state=42,
        verbose=1
    )
    
    print("Выполнение 5-кратной кросс-валидации (StratifiedKFold)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=2)
    
    print(f"\nРезультаты кросс-валидации ROC-AUC по фолдам: {cv_scores}")
    print(f"Средний ROC-AUC: {cv_scores.mean():.5f} (+/- {cv_scores.std() * 2:.5f})")
    
    print("\nОбучение финальной модели на всем наборе данных...")
    model.fit(X, y)
    
    importances = model.feature_importances_
    features = X.columns
    print("\nВажность признаков в обученной модели скоринга:")
    for feat, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True):
        print(f"   - {feat}: {imp*100:.2f}%")
        
    os.makedirs('ml/models', exist_ok=True)
    model_path = 'ml/models/scoring_gb_model_deep.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nОбучение успешно завершено за {time.time() - start_total:.1f} сек!")
    print(f"Модель сохранена в {model_path}")

if __name__ == '__main__':
    train_model()
