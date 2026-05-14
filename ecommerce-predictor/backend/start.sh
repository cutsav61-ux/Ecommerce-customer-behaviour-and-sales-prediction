#!/bin/bash
# ─── PredictIQ Backend Startup ───────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     PredictIQ — Backend Startup      ║"
echo "╚══════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌  Python 3 not found. Please install Python 3.9+"
  exit 1
fi

echo "✅  Python: $(python3 --version)"

# Create virtual environment if needed
if [ ! -d "venv" ]; then
  echo "📦  Creating virtual environment..."
  python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install dependencies
echo "📦  Installing dependencies..."
pip install -r requirements.txt -q

# Create directories
mkdir -p uploads
mkdir -p ../ml/models

# Pre-train on sample data so predictions work immediately
echo ""
echo "🧠  Pre-training ML models on sample data..."
cd ../ml
python3 -c "
from train_model import generate_sample_dataset, train_classification_model, train_regression_model
df = generate_sample_dataset(500)
train_classification_model(df, 'purchased')
train_regression_model(df, 'sales_amount')
print('✅  Models ready!')
"
cd ../backend

echo ""
echo "🚀  Starting Flask API on http://localhost:5000"
echo ""
python3 app.py
