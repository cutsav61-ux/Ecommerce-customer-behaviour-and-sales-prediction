# 🧠 PredictIQ — E-commerce Customer Behaviour & Sales Prediction

A **premium, production-grade** AI analytics platform for predicting customer purchase behavior and sales revenue in e-commerce.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📊 **Dashboard** | Real-time KPIs, revenue trends, customer segments |
| 📁 **Dataset Upload** | CSV / Excel upload or use built-in sample data |
| 🤖 **ML Training** | Random Forest (behavior) + Gradient Boosting (sales) |
| 🧠 **Behavior Prediction** | Per-customer purchase probability with confidence |
| 💰 **Sales Forecast** | Predicted revenue per customer, scenario comparison |
| 📋 **History** | Full prediction log with export to CSV |
| 🔐 **Admin Panel** | Dataset management, model status, system overview |
| 🌙 **Dark/Light Mode** | Smooth toggle with persistence |
| 📱 **Responsive** | Mobile-first, works on all screen sizes |

---

## 🏗️ Architecture

```
ecommerce-predictor/
├── backend/          # Python Flask REST API
│   ├── app.py        # Main API server (all routes)
│   ├── requirements.txt
│   └── start.sh
├── frontend/         # React + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx           # Root with routing & context
│   │   ├── pages/            # All page components
│   │   ├── components/       # Layout & shared components
│   │   └── utils/api.js      # Axios API client
│   ├── package.json
│   └── start.sh
├── ml/               # Machine Learning module
│   ├── train_model.py        # Training & prediction logic
│   └── models/               # Saved .joblib model files (auto-created)
├── start.sh          # One-command startup (backend + frontend)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **pip** (comes with Python)
- **npm** (comes with Node.js)

### Option 1: One Command (Recommended)

```bash
cd ecommerce-predictor
chmod +x start.sh
./start.sh
```

This will:
1. Create Python virtual environment
2. Install all Python dependencies
3. Pre-train ML models on sample data
4. Start Flask backend on `http://localhost:5000`
5. Install npm packages
6. Start React frontend on `http://localhost:3000`

Then open **http://localhost:3000** in your browser.

---

### Option 2: Manual Setup

#### Backend

```bash
cd ecommerce-predictor/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Pre-train models (optional but recommended)
cd ../ml
python3 train_model.py
cd ../backend

# Start server
python3 app.py
```

#### Frontend (new terminal)

```bash
cd ecommerce-predictor/frontend

# Install packages
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000**

---

## 🔐 Admin Login

- **URL**: http://localhost:3000/admin
- **Username**: `admin`
- **Password**: `admin123`

---

## 📊 Using the App

### 1. Upload Your Dataset
- Go to **Upload Dataset**
- Upload a CSV/Excel with customer data
- Or click **"Use Sample Data"** to load a pre-built dataset
- Dataset must have columns matching your target variable names

### 2. Train Models
- Go to **Train Models**
- Select your dataset (or leave blank for sample data)
- Set target column names:
  - Classification target: e.g., `purchased` (0/1 column)
  - Regression target: e.g., `sales_amount` (numeric column)
- Click **Start Training**
- View accuracy, confusion matrix, and feature importances

### 3. Make Predictions
- **Customer Behavior**: Input customer attributes → get purchase probability
- **Sales Forecast**: Input customer profile → get predicted revenue
- Both pages support **batch prediction** via CSV upload

### 4. View History
- All predictions are logged automatically
- Filter by type, search by any value
- Export all results to CSV

---

## 📋 Expected Dataset Format

Your CSV should have columns like:

| Column | Type | Example |
|---|---|---|
| age | number | 32 |
| annual_income | number | 65000 |
| spending_score | number (1-100) | 75 |
| previous_purchases | number | 8 |
| avg_session_duration | number | 12.5 |
| pages_visited | number | 18 |
| cart_abandonment_rate | number (0-1) | 0.2 |
| days_since_last_purchase | number | 15 |
| email_open_rate | number (0-1) | 0.45 |
| gender | text | Male/Female |
| device_type | text | Mobile/Desktop |
| location | text | Urban/Suburban |
| membership_tier | text | Gold/Silver |
| **purchased** | 0 or 1 | 1 ← classification target |
| **sales_amount** | number | 249.99 ← regression target |

Download a template from the Upload page.

---

## 🛠 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard KPIs & charts |
| POST | `/api/dataset/upload` | Upload CSV/Excel |
| GET | `/api/dataset/sample` | Load sample dataset |
| POST | `/api/model/train` | Train ML models |
| GET | `/api/model/status` | Model training status |
| POST | `/api/predict/behavior` | Predict purchase behavior |
| POST | `/api/predict/sales` | Predict sales amount |
| POST | `/api/predict/batch` | Batch CSV predictions |
| GET | `/api/predict/history` | Prediction history |
| GET | `/api/export/predictions` | Export history CSV |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/admin/overview` | Admin stats (auth required) |

---

## 🤖 ML Models

| Model | Algorithm | Task | Metric |
|---|---|---|---|
| Customer Behavior | Random Forest Classifier | Binary classification | Accuracy % |
| Sales Prediction | Gradient Boosting Regressor | Regression | R² Score % |

Both models:
- Auto-handle missing values (median imputation)
- Encode categorical features (LabelEncoder)
- Scale features (StandardScaler)
- Show feature importance rankings
- Save/load via joblib

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | CSS keyframes + Tailwind |
| HTTP Client | Axios |
| Backend | Python Flask, Flask-CORS |
| ML | scikit-learn (RandomForest, GradientBoosting) |
| Auth | PyJWT |
| Data | Pandas, NumPy |
| Model Storage | joblib |

---

## 🗜️ Zip & Share

```bash
# From parent directory
zip -r PredictIQ.zip ecommerce-predictor/ \
  --exclude "*/node_modules/*" \
  --exclude "*/__pycache__/*" \
  --exclude "*/venv/*" \
  --exclude "*/.git/*" \
  --exclude "*/ml/models/*"
```

The recipient runs:
```bash
unzip PredictIQ.zip
cd ecommerce-predictor
chmod +x start.sh
./start.sh
```

---

## 🔧 Troubleshooting

**Port already in use?**
```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**Models not trained error?**
- Go to Train Models page and click Start Training (or run `python3 ml/train_model.py`)

**CORS errors?**
- Ensure backend is running on port 5000
- Vite proxy is configured in `frontend/vite.config.js`

**Excel file not uploading?**
```bash
pip install openpyxl xlrd
```

---

*Built with ❤️ — PredictIQ v1.0*
