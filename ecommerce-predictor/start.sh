#!/bin/bash
# ─── PredictIQ — Start Everything ────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   PredictIQ — E-commerce Intelligence        ║"
echo "║   Starting Backend + Frontend together       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Kill old processes on ports 5000 and 3000
echo "🔄  Clearing ports 5000 and 3000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "🐍  Setting up Python backend..."
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q

# Pre-train models
cd "$ROOT/ml"
python3 -c "
from train_model import generate_sample_dataset, train_classification_model, train_regression_model
df = generate_sample_dataset(500)
train_classification_model(df, 'purchased')
train_regression_model(df, 'sales_amount')
print('Models pre-trained!')
" 2>&1 | grep -v "^$"

cd "$ROOT/backend"
python3 app.py &
BACKEND_PID=$!
echo "✅  Backend running (PID $BACKEND_PID) → http://localhost:5000"

# Wait for backend to start
sleep 3

# ── Frontend ─────────────────────────────────────────────────────────────────
echo ""
echo "⚛️   Setting up React frontend..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "📦  Installing npm packages (first time, ~30s)..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "✅  Frontend running (PID $FRONTEND_PID) → http://localhost:3000"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  PredictIQ is running!                   ║"
echo "║                                              ║"
echo "║  Frontend:  http://localhost:3000            ║"
echo "║  Backend:   http://localhost:5000            ║"
echo "║  Admin:     http://localhost:3000/admin      ║"
echo "║                                              ║"
echo "║  Admin login: admin / admin123               ║"
echo "║                                              ║"
echo "║  Press Ctrl+C to stop everything            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Trap Ctrl+C and kill both
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
