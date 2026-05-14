"""
E-commerce Predictor - Flask Backend API
Production-ready REST API with ML integration
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import sys
import json
import io
import csv
import joblib
from datetime import datetime, timedelta
import random
import hashlib
import jwt
from functools import wraps

# Add ML module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))
from train_model import (
    train_classification_model,
    train_regression_model,
    predict_classification,
    predict_regression,
    generate_sample_dataset,
    MODEL_DIR
)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

app.config['SECRET_KEY'] = 'ecommerce_predictor_secret_key_2024'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# In-memory store (replace with DB in production)
DATASETS = {}
MODEL_STATUS = {
    'classification': {'trained': False, 'accuracy': None, 'last_trained': None},
    'regression': {'trained': False, 'r2_score': None, 'last_trained': None}
}
ADMIN_USERS = {
    'admin': hashlib.sha256('admin123'.encode()).hexdigest()
}
PREDICTION_HISTORY = []

# ─── Auth ────────────────────────────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '')
    password = data.get('password', '')
    hashed = hashlib.sha256(password.encode()).hexdigest()
    
    if username in ADMIN_USERS and ADMIN_USERS[username] == hashed:
        token = jwt.encode(
            {'user': username, 'exp': datetime.utcnow() + timedelta(hours=24)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )
        return jsonify({'token': token, 'user': username, 'role': 'admin'})
    return jsonify({'error': 'Invalid credentials'}), 401


# ─── Dashboard ───────────────────────────────────────────────────────────────

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Return dashboard statistics"""
    n = 1000 + len(PREDICTION_HISTORY) * 3
    
    # Simulate time-series data
    now = datetime.now()
    daily_data = []
    for i in range(30):
        day = now - timedelta(days=29-i)
        daily_data.append({
            'date': day.strftime('%b %d'),
            'revenue': round(random.gauss(5200, 800) + i * 45, 2),
            'customers': random.randint(80, 180),
            'conversions': random.randint(20, 60)
        })
    
    weekly_data = []
    for i in range(12):
        week = now - timedelta(weeks=11-i)
        weekly_data.append({
            'week': f'W{week.isocalendar()[1]}',
            'revenue': round(random.gauss(35000, 5000) + i * 300, 2),
            'customers': random.randint(500, 1200),
            'conversions': random.randint(120, 350)
        })
    
    clf_trained = os.path.exists(os.path.join(MODEL_DIR, 'classification_model.joblib'))
    reg_trained = os.path.exists(os.path.join(MODEL_DIR, 'regression_model.joblib'))
    
    return jsonify({
        'total_customers': n,
        'predicted_revenue': round(n * 127.5 + random.gauss(0, 500), 2),
        'conversion_rate': round(random.gauss(34.2, 2), 1),
        'avg_order_value': round(random.gauss(127.5, 15), 2),
        'total_predictions': len(PREDICTION_HISTORY),
        'active_datasets': len(DATASETS),
        'models_trained': (1 if clf_trained else 0) + (1 if reg_trained else 0),
        'daily_data': daily_data,
        'weekly_data': weekly_data,
        'customer_segments': [
            {'segment': 'High Value', 'count': int(n * 0.15), 'color': '#6366f1'},
            {'segment': 'Regular', 'count': int(n * 0.45), 'color': '#22d3ee'},
            {'segment': 'At Risk', 'count': int(n * 0.25), 'color': '#f59e0b'},
            {'segment': 'Inactive', 'count': int(n * 0.15), 'color': '#ef4444'},
        ]
    })


# ─── Dataset ─────────────────────────────────────────────────────────────────

@app.route('/api/dataset/upload', methods=['POST'])
def upload_dataset():
    """Upload CSV/Excel dataset"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty filename'}), 400
    
    filename = file.filename.lower()
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': 'Only CSV and Excel files are supported'}), 400
        
        dataset_id = f"ds_{len(DATASETS)+1}_{datetime.now().strftime('%H%M%S')}"
        DATASETS[dataset_id] = {
            'id': dataset_id,
            'name': file.filename,
            'df': df,
            'columns': df.columns.tolist(),
            'shape': list(df.shape),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'uploaded_at': datetime.now().isoformat(),
            'preview': df.head(5).fillna('').to_dict(orient='records')
        }
        
        return jsonify({
            'dataset_id': dataset_id,
            'name': file.filename,
            'rows': df.shape[0],
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'preview': df.head(5).fillna('').to_dict(orient='records'),
            'null_counts': df.isnull().sum().to_dict(),
            'message': f'Dataset uploaded successfully: {df.shape[0]} rows × {df.shape[1]} columns'
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 400


@app.route('/api/dataset/sample', methods=['GET'])
def get_sample_dataset():
    """Generate and return a sample dataset"""
    df = generate_sample_dataset(300)
    
    dataset_id = f"ds_sample_{datetime.now().strftime('%H%M%S')}"
    DATASETS[dataset_id] = {
        'id': dataset_id,
        'name': 'sample_ecommerce_data.csv',
        'df': df,
        'columns': df.columns.tolist(),
        'shape': list(df.shape),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'uploaded_at': datetime.now().isoformat(),
        'preview': df.head(5).to_dict(orient='records')
    }
    
    return jsonify({
        'dataset_id': dataset_id,
        'name': 'sample_ecommerce_data.csv',
        'rows': df.shape[0],
        'columns': df.columns.tolist(),
        'preview': df.head(5).fillna('').to_dict(orient='records'),
        'message': f'Sample dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns'
    })


@app.route('/api/dataset/list', methods=['GET'])
def list_datasets():
    return jsonify([{
        'id': v['id'], 'name': v['name'],
        'rows': v['shape'][0], 'cols': v['shape'][1],
        'uploaded_at': v['uploaded_at']
    } for v in DATASETS.values()])


@app.route('/api/dataset/download-sample', methods=['GET'])
def download_sample():
    """Download sample CSV"""
    df = generate_sample_dataset(100)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return send_file(
        io.BytesIO(buf.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='sample_ecommerce_dataset.csv'
    )


# ─── Model Training ──────────────────────────────────────────────────────────

@app.route('/api/model/train', methods=['POST'])
def train_model():
    """Train ML models on uploaded dataset"""
    data = request.json or {}
    dataset_id = data.get('dataset_id')
    target_clf = data.get('classification_target', 'purchased')
    target_reg = data.get('regression_target', 'sales_amount')
    model_type = data.get('model_type', 'both')
    
    if dataset_id and dataset_id in DATASETS:
        df = DATASETS[dataset_id]['df']
    else:
        # Use sample data
        df = generate_sample_dataset(500)
    
    results = {}
    
    try:
        if model_type in ('both', 'classification') and target_clf in df.columns:
            clf_results = train_classification_model(df, target_clf)
            MODEL_STATUS['classification'] = {
                'trained': True,
                'accuracy': clf_results['accuracy'],
                'last_trained': datetime.now().isoformat(),
                'details': clf_results
            }
            results['classification'] = clf_results
        
        if model_type in ('both', 'regression') and target_reg in df.columns:
            reg_results = train_regression_model(df, target_reg)
            MODEL_STATUS['regression'] = {
                'trained': True,
                'r2_score': reg_results['r2_score'],
                'last_trained': datetime.now().isoformat(),
                'details': reg_results
            }
            results['regression'] = reg_results
        
        if not results:
            return jsonify({'error': 'No valid target columns found in dataset'}), 400
        
        return jsonify({
            'success': True,
            'results': results,
            'message': 'Models trained successfully!'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/model/status', methods=['GET'])
def model_status():
    clf_exists = os.path.exists(os.path.join(MODEL_DIR, 'classification_model.joblib'))
    reg_exists = os.path.exists(os.path.join(MODEL_DIR, 'regression_model.joblib'))
    
    return jsonify({
        'classification': {
            **MODEL_STATUS['classification'],
            'trained': clf_exists or MODEL_STATUS['classification']['trained']
        },
        'regression': {
            **MODEL_STATUS['regression'],
            'trained': reg_exists or MODEL_STATUS['regression']['trained']
        }
    })


# ─── Predictions ─────────────────────────────────────────────────────────────

@app.route('/api/predict/behavior', methods=['POST'])
def predict_behavior():
    """Predict customer purchase behavior"""
    data = request.json or {}
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    try:
        result = predict_classification(data)
        
        PREDICTION_HISTORY.append({
            'type': 'classification',
            'input': data,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({**result, 'timestamp': datetime.now().isoformat()})
    
    except FileNotFoundError as e:
        return jsonify({'error': str(e), 'needs_training': True}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/api/predict/sales', methods=['POST'])
def predict_sales():
    """Predict sales amount"""
    data = request.json or {}
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    try:
        result = predict_regression(data)
        
        PREDICTION_HISTORY.append({
            'type': 'regression',
            'input': data,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({**result, 'timestamp': datetime.now().isoformat()})
    
    except FileNotFoundError as e:
        return jsonify({'error': str(e), 'needs_training': True}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """Batch predictions from file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    pred_type = request.form.get('type', 'behavior')
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        results = []
        for _, row in df.iterrows():
            record = row.to_dict()
            try:
                if pred_type == 'behavior':
                    pred = predict_classification(record)
                else:
                    pred = predict_regression(record)
                results.append({**record, **pred, 'status': 'success'})
            except Exception as e:
                results.append({**record, 'status': 'error', 'error': str(e)})
        
        return jsonify({
            'total': len(results),
            'successful': sum(1 for r in results if r['status'] == 'success'),
            'results': results[:100]  # Limit response size
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict/history', methods=['GET'])
def prediction_history():
    limit = int(request.args.get('limit', 50))
    return jsonify(PREDICTION_HISTORY[-limit:][::-1])


# ─── Export ──────────────────────────────────────────────────────────────────

@app.route('/api/export/predictions', methods=['GET'])
def export_predictions():
    """Export prediction history as CSV"""
    if not PREDICTION_HISTORY:
        return jsonify({'error': 'No predictions to export'}), 404
    
    rows = []
    for p in PREDICTION_HISTORY:
        row = {'timestamp': p['timestamp'], 'type': p['type']}
        row.update(p['input'])
        result = p['result']
        if p['type'] == 'classification':
            row['prediction'] = result.get('prediction')
            row['confidence'] = result.get('confidence')
            row['will_purchase'] = result.get('will_purchase')
        else:
            row['predicted_sales'] = result.get('predicted_sales')
            row['category'] = result.get('category')
        rows.append(row)
    
    df = pd.DataFrame(rows)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    
    return send_file(
        io.BytesIO(buf.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'predictions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )


# ─── Admin ───────────────────────────────────────────────────────────────────

@app.route('/api/admin/overview', methods=['GET'])
@token_required
def admin_overview():
    return jsonify({
        'total_predictions': len(PREDICTION_HISTORY),
        'datasets': len(DATASETS),
        'model_status': MODEL_STATUS,
        'system': {
            'python_version': sys.version,
            'model_dir': MODEL_DIR,
            'upload_dir': app.config['UPLOAD_FOLDER']
        }
    })


@app.route('/api/admin/datasets', methods=['GET'])
@token_required
def admin_datasets():
    return jsonify([{
        'id': v['id'], 'name': v['name'],
        'rows': v['shape'][0], 'cols': v['shape'][1],
        'columns': v['columns'],
        'uploaded_at': v['uploaded_at']
    } for v in DATASETS.values()])


@app.route('/api/admin/datasets/<dataset_id>', methods=['DELETE'])
@token_required
def delete_dataset(dataset_id):
    if dataset_id in DATASETS:
        del DATASETS[dataset_id]
        return jsonify({'message': 'Dataset deleted'})
    return jsonify({'error': 'Dataset not found'}), 404


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat(), 'version': '1.0.0'})


if __name__ == '__main__':
    print("🚀 E-commerce Predictor API starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
