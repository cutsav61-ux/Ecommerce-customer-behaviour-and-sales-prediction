import React, { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Cpu, Play, CheckCircle, AlertCircle, RefreshCw, Brain, TrendingUp, Loader } from 'lucide-react'
import { modelAPI, datasetAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function TrainModel() {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [modelType, setModelType] = useState('both')
  const [clfTarget, setClfTarget] = useState('purchased')
  const [regTarget, setRegTarget] = useState('sales_amount')
  const [training, setTraining] = useState(false)
  const [results, setResults] = useState(null)
  const [modelStatus, setModelStatus] = useState(null)

  useEffect(() => {
    datasetAPI.list().then(r => setDatasets(r.data)).catch(() => {})
    modelAPI.status().then(r => setModelStatus(r.data)).catch(() => {})
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    setResults(null)
    try {
      const payload = {
        dataset_id: selectedDataset || undefined,
        classification_target: clfTarget,
        regression_target: regTarget,
        model_type: modelType,
      }
      const res = await modelAPI.train(payload)
      setResults(res.data.results)
      toast.success('🎉 Models trained successfully!')
      modelAPI.status().then(r => setModelStatus(r.data)).catch(() => {})
    } catch (e) {
      toast.error('Training failed: ' + e.message)
    } finally {
      setTraining(false)
    }
  }

  const featureData = (featureImportance) => Object.entries(featureImportance || {})
    .slice(0, 8)
    .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: Math.round(v * 100) }))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Train ML Models</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Configure and train classification and regression models
        </p>
      </div>

      {/* Status badges */}
      {modelStatus && (
        <div className="flex flex-wrap gap-3 animate-slide-up">
          <ModelStatusBadge label="Classification Model" status={modelStatus.classification} metric="accuracy" unit="%" />
          <ModelStatusBadge label="Regression Model" status={modelStatus.regression} metric="r2_score" unit="% R²" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <h3 className="font-semibold text-sm mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              <Cpu size={16} className="inline mr-2" style={{ color: '#4f6ef7' }} />
              Training Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Dataset</label>
                <select className="input-field" value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}>
                  <option value="">Use sample data (auto)</option>
                  {datasets.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.rows} rows)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Model Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['both', 'Both'], ['classification', 'Behavior'], ['regression', 'Sales']].map(([v, l]) => (
                    <button key={v} onClick={() => setModelType(v)}
                      className={`text-xs px-2 py-2 rounded-lg font-medium transition-all ${modelType === v ? 'btn-primary' : 'btn-secondary'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {(modelType === 'both' || modelType === 'classification') && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Classification Target Column</label>
                  <input className="input-field" value={clfTarget} onChange={e => setClfTarget(e.target.value)} placeholder="e.g. purchased" />
                </div>
              )}

              {(modelType === 'both' || modelType === 'regression') && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Regression Target Column</label>
                  <input className="input-field" value={regTarget} onChange={e => setRegTarget(e.target.value)} placeholder="e.g. sales_amount" />
                </div>
              )}

              <button onClick={handleTrain} disabled={training} className="btn-primary w-full justify-center">
                {training ? (
                  <><Loader size={16} className="animate-spin" /> Training...</>
                ) : (
                  <><Play size={16} /> Start Training</>
                )}
              </button>
            </div>
          </div>

          {/* Models info */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: 'Space Grotesk' }}>Algorithms Used</h3>
            {[
              { icon: Brain, label: 'Random Forest', desc: 'Customer behavior classification', color: '#4f6ef7' },
              { icon: TrendingUp, label: 'Gradient Boosting', desc: 'Sales amount prediction', color: '#22d3ee' },
            ].map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <div className="p-2 rounded-lg shrink-0" style={{ background: `${m.color}18` }}>
                  <m.icon size={15} style={{ color: m.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">{m.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {training && <TrainingProgress />}

          {results?.classification && (
            <div className="card animate-scale-in">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-green-400" />
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Classification Results</h3>
                <span className="badge badge-success ml-auto">{results.classification.accuracy}% Accuracy</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ['Accuracy', `${results.classification.accuracy}%`, '#4f6ef7'],
                  ['Samples Trained', results.classification.samples_trained?.toLocaleString(), '#22d3ee'],
                  ['Model', results.classification.model_type?.replace('Random Forest ', 'RF '), '#10b981'],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className="font-bold text-sm mt-1" style={{ color: c, fontFamily: 'Space Grotesk' }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Confusion Matrix */}
              {results.classification.confusion_matrix && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Confusion Matrix</p>
                  <ConfusionMatrix matrix={results.classification.confusion_matrix} />
                </div>
              )}

              {/* Feature importance */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Feature Importance</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={featureData(results.classification.feature_importance)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Importance']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {featureData(results.classification.feature_importance).map((_, i) => (
                        <Cell key={i} fill={`hsl(${220 + i * 15}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {results?.regression && (
            <div className="card animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-green-400" />
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Regression Results</h3>
                <span className="badge badge-cyan ml-auto">R² {results.regression.r2_score}%</span>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  ['R² Score', `${results.regression.r2_score}%`, '#22d3ee'],
                  ['RMSE', `$${results.regression.rmse}`, '#f59e0b'],
                  ['MAE', `$${results.regression.mae}`, '#10b981'],
                  ['Avg Prediction', `$${results.regression.avg_prediction}`, '#4f6ef7'],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className="font-bold text-sm mt-1" style={{ color: c, fontFamily: 'Space Grotesk' }}>{v}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Feature Importance</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={featureData(results.regression.feature_importance)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Importance']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!results && !training && (
            <div className="card flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <Cpu size={40} style={{ color: 'var(--text-muted)' }} className="mb-3 opacity-30" />
              <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>No training results yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Configure and click "Start Training"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfusionMatrix({ matrix }) {
  const max = Math.max(...matrix.flat())
  return (
    <div className="inline-block">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` }}>
        {matrix.map((row, i) => row.map((val, j) => (
          <div key={`${i}-${j}`} className="w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
            style={{
              background: i === j ? `rgba(79,110,247,${0.2 + (val / max) * 0.6})` : `rgba(239,68,68,${0.1 + (val / max) * 0.4})`,
              color: i === j ? '#4f6ef7' : '#ef4444'
            }}>
            {val}
          </div>
        )))}
      </div>
      <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: 'rgba(79,110,247,0.5)' }} /> True</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.4)' }} /> False</span>
      </div>
    </div>
  )
}

function ModelStatusBadge({ label, status, metric, unit }) {
  const trained = status?.trained
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className={`w-2 h-2 rounded-full ${trained ? 'bg-green-400' : 'bg-gray-500'}`} />
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
      {trained && status?.[metric] && (
        <span className="badge badge-success text-xs">{status[metric]}{unit}</span>
      )}
      {!trained && <span className="badge badge-warning text-xs">Not trained</span>}
    </div>
  )
}

function TrainingProgress() {
  const [step, setStep] = useState(0)
  const steps = ['Loading dataset...', 'Preprocessing features...', 'Training models...', 'Evaluating performance...']

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % steps.length), 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card animate-scale-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#4f6ef7', borderTopColor: 'transparent' }} />
        <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Training in progress...</h3>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${i < step ? 'bg-green-400' : i === step ? 'border-2 animate-pulse' : 'border'}`}
              style={{ borderColor: i === step ? '#4f6ef7' : 'var(--border)', background: i < step ? '#10b981' : 'transparent' }}>
              {i < step && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={`text-xs transition-colors ${i === step ? 'font-semibold' : ''}`}
              style={{ color: i <= step ? 'var(--text)' : 'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar mt-4">
        <div className="progress-fill" style={{ width: `${(step + 1) * 25}%` }} />
      </div>
    </div>
  )
}
