"""
E-commerce Customer Behavior & Sales Prediction ML Module
Handles training and prediction for both classification and regression models
"""

import pandas as pd
import numpy as np
import joblib
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    mean_squared_error, r2_score, mean_absolute_error
)
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)


def preprocess_data(df, target_col, task='classification'):
    """Preprocess dataframe for ML training"""
    df = df.copy()
    
    # Drop rows where target is missing
    df = df.dropna(subset=[target_col])
    
    # Separate features and target
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Encode categorical columns
    label_encoders = {}
    for col in X.select_dtypes(include=['object', 'category']).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le
    
    # Encode target if classification
    target_encoder = None
    if task == 'classification' and y.dtype == object:
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y.astype(str))
    
    # Handle missing values
    imputer = SimpleImputer(strategy='mean')
    X_imputed = imputer.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=X.columns)
    
    return X, y, label_encoders, target_encoder, imputer


def train_classification_model(df, target_col='purchased'):
    """Train customer behavior classification model"""
    print(f"Training classification model with {len(df)} samples...")
    
    X, y, label_encoders, target_encoder, imputer = preprocess_data(df, target_col, 'classification')
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest for better accuracy
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)
    
    accuracy = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)
    
    # Feature importance
    feature_importance = dict(zip(X.columns.tolist(), model.feature_importances_.tolist()))
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Save model artifacts
    artifacts = {
        'model': model,
        'scaler': scaler,
        'imputer': imputer,
        'label_encoders': label_encoders,
        'target_encoder': target_encoder,
        'feature_columns': X.columns.tolist(),
        'target_col': target_col,
        'task': 'classification'
    }
    joblib.dump(artifacts, os.path.join(MODEL_DIR, 'classification_model.joblib'))
    
    results = {
        'accuracy': round(accuracy * 100, 2),
        'confusion_matrix': cm,
        'classification_report': report,
        'feature_importance': feature_importance,
        'samples_trained': len(X_train),
        'samples_tested': len(X_test),
        'model_type': 'Random Forest Classifier',
        'classes': model.classes_.tolist()
    }
    
    print(f"Classification model trained. Accuracy: {accuracy:.4f}")
    return results


def train_regression_model(df, target_col='sales_amount'):
    """Train sales prediction regression model"""
    print(f"Training regression model with {len(df)} samples...")
    
    X, y, label_encoders, target_encoder, imputer = preprocess_data(df, target_col, 'regression')
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Gradient Boosting for regression
    model = GradientBoostingRegressor(n_estimators=100, random_state=42, learning_rate=0.1)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Feature importance
    feature_importance = dict(zip(X.columns.tolist(), model.feature_importances_.tolist()))
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Save model artifacts
    artifacts = {
        'model': model,
        'scaler': scaler,
        'imputer': imputer,
        'label_encoders': label_encoders,
        'feature_columns': X.columns.tolist(),
        'target_col': target_col,
        'task': 'regression',
        'y_mean': float(np.mean(y_train)),
        'y_std': float(np.std(y_train))
    }
    joblib.dump(artifacts, os.path.join(MODEL_DIR, 'regression_model.joblib'))
    
    results = {
        'r2_score': round(r2 * 100, 2),
        'rmse': round(rmse, 2),
        'mae': round(mae, 2),
        'mse': round(mse, 2),
        'feature_importance': feature_importance,
        'samples_trained': len(X_train),
        'samples_tested': len(X_test),
        'model_type': 'Gradient Boosting Regressor',
        'avg_prediction': round(float(np.mean(y_pred)), 2)
    }
    
    print(f"Regression model trained. R2: {r2:.4f}")
    return results


def predict_classification(input_data: dict):
    """Predict customer purchase behavior"""
    model_path = os.path.join(MODEL_DIR, 'classification_model.joblib')
    if not os.path.exists(model_path):
        raise FileNotFoundError("Classification model not trained yet. Please upload a dataset and train first.")
    
    artifacts = joblib.load(model_path)
    model = artifacts['model']
    scaler = artifacts['scaler']
    imputer = artifacts['imputer']
    label_encoders = artifacts['label_encoders']
    feature_columns = artifacts['feature_columns']
    target_encoder = artifacts['target_encoder']
    
    # Build input dataframe
    input_df = pd.DataFrame([input_data])
    
    # Encode categorical columns
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0
        if col in label_encoders:
            le = label_encoders[col]
            val = str(input_df[col].iloc[0])
            if val in le.classes_:
                input_df[col] = le.transform([val])
            else:
                input_df[col] = 0
    
    input_df = input_df[feature_columns]
    input_imputed = imputer.transform(input_df)
    input_scaled = scaler.transform(input_imputed)
    
    prediction = model.predict(input_scaled)[0]
    probabilities = model.predict_proba(input_scaled)[0]
    
    # Decode prediction
    if target_encoder:
        pred_label = target_encoder.inverse_transform([prediction])[0]
    else:
        pred_label = str(prediction)
    
    # Confidence
    confidence = float(max(probabilities)) * 100
    
    # Human-readable insight
    if confidence >= 75:
        insight = "High probability of purchase. Consider targeted promotions."
    elif confidence >= 50:
        insight = "Moderate purchase likelihood. Engage with personalized offers."
    else:
        insight = "Low purchase probability. Re-engagement campaign recommended."
    
    return {
        'prediction': pred_label,
        'confidence': round(confidence, 1),
        'probabilities': {str(cls): round(float(prob) * 100, 1) for cls, prob in zip(model.classes_, probabilities)},
        'insight': insight,
        'will_purchase': bool(confidence >= 50)
    }


def predict_regression(input_data: dict):
    """Predict sales amount"""
    model_path = os.path.join(MODEL_DIR, 'regression_model.joblib')
    if not os.path.exists(model_path):
        raise FileNotFoundError("Regression model not trained yet. Please upload a dataset and train first.")
    
    artifacts = joblib.load(model_path)
    model = artifacts['model']
    scaler = artifacts['scaler']
    imputer = artifacts['imputer']
    label_encoders = artifacts['label_encoders']
    feature_columns = artifacts['feature_columns']
    y_mean = artifacts.get('y_mean', 0)
    
    input_df = pd.DataFrame([input_data])
    
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0
        if col in label_encoders:
            le = label_encoders[col]
            val = str(input_df[col].iloc[0])
            if val in le.classes_:
                input_df[col] = le.transform([val])
            else:
                input_df[col] = 0
    
    input_df = input_df[feature_columns]
    input_imputed = imputer.transform(input_df)
    input_scaled = scaler.transform(input_imputed)
    
    prediction = float(model.predict(input_scaled)[0])
    
    # Generate insight
    if prediction > y_mean * 1.5:
        insight = "High-value customer. Prioritize with premium service."
    elif prediction > y_mean:
        insight = "Above-average sales expected. Good conversion opportunity."
    elif prediction > y_mean * 0.5:
        insight = "Moderate sales expected. Standard engagement recommended."
    else:
        insight = "Below-average sales predicted. Consider discount incentives."
    
    return {
        'predicted_sales': round(prediction, 2),
        'insight': insight,
        'category': 'High' if prediction > y_mean * 1.5 else 'Medium' if prediction > y_mean * 0.7 else 'Low'
    }


def generate_sample_dataset(n_samples=500):
    """Generate a realistic sample e-commerce dataset for demo"""
    np.random.seed(42)
    
    ages = np.random.normal(35, 12, n_samples).clip(18, 70).astype(int)
    incomes = np.random.lognormal(10.5, 0.5, n_samples).clip(20000, 200000).astype(int)
    
    data = {
        'age': ages,
        'annual_income': incomes,
        'spending_score': np.random.randint(1, 101, n_samples),
        'previous_purchases': np.random.poisson(5, n_samples),
        'avg_session_duration': np.random.exponential(8, n_samples).clip(0.5, 60).round(1),
        'pages_visited': np.random.poisson(12, n_samples),
        'cart_abandonment_rate': np.random.beta(2, 5, n_samples).round(3),
        'days_since_last_purchase': np.random.exponential(30, n_samples).clip(0, 365).astype(int),
        'email_open_rate': np.random.beta(3, 7, n_samples).round(3),
        'gender': np.random.choice(['Male', 'Female', 'Other'], n_samples, p=[0.48, 0.48, 0.04]),
        'device_type': np.random.choice(['Mobile', 'Desktop', 'Tablet'], n_samples, p=[0.55, 0.35, 0.10]),
        'location': np.random.choice(['Urban', 'Suburban', 'Rural'], n_samples, p=[0.50, 0.35, 0.15]),
        'membership_tier': np.random.choice(['Bronze', 'Silver', 'Gold', 'Platinum'], n_samples, p=[0.4, 0.3, 0.2, 0.1])
    }
    
    df = pd.DataFrame(data)
    
    # Create purchase probability based on features
    purchase_score = (
        0.3 * (df['spending_score'] / 100) +
        0.2 * (df['previous_purchases'] / df['previous_purchases'].max()) +
        0.15 * (1 - df['cart_abandonment_rate']) +
        0.15 * (df['email_open_rate']) +
        0.1 * (1 - df['days_since_last_purchase'] / 365) +
        0.1 * np.random.random(n_samples)
    )
    df['purchased'] = (purchase_score > 0.45).astype(int)
    
    # Sales amount
    df['sales_amount'] = (
        incomes * 0.001 * purchase_score * np.random.lognormal(0, 0.3, n_samples)
    ).round(2)
    
    return df


if __name__ == '__main__':
    # Demo: generate and train on sample data
    print("Generating sample dataset...")
    df = generate_sample_dataset(500)
    print(f"Dataset shape: {df.shape}")
    
    print("\nTraining classification model...")
    clf_results = train_classification_model(df, 'purchased')
    print(f"Accuracy: {clf_results['accuracy']}%")
    
    print("\nTraining regression model...")
    reg_results = train_regression_model(df, 'sales_amount')
    print(f"R2 Score: {reg_results['r2_score']}%")
    
    print("\nModels trained and saved successfully!")
