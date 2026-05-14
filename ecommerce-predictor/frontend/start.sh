#!/bin/bash
# ─── PredictIQ Frontend Startup ──────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║    PredictIQ — Frontend Startup      ║"
echo "╚══════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Please install Node.js 18+"
  exit 1
fi

echo "✅  Node: $(node --version)"
echo "✅  npm:  $(npm --version)"

# Install
if [ ! -d "node_modules" ]; then
  echo "📦  Installing npm packages..."
  npm install
fi

echo ""
echo "🚀  Starting React dev server on http://localhost:3000"
echo ""
npm run dev
