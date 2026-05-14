import React, { useState } from 'react'
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer } from 'recharts'
import { BrainCircuit, Loader, CheckCircle, XCircle, Upload, User } from 'lucide-react'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

const DEFAULT_FORM = {
  age: 32,
  annual_income: 65000,
  spending_score: 75,
  previous_purchases: 8,
  avg_session_duration: 12.5,
  pages_visited: 18,
  cart_abandonment_rate: 0.2,
  days_since_last_purchase: 15,
  email_open_rate: 0.45,
  gender: 'Female',
  device_type: 'Mobile',
  location: 'Urban',
  membership_tier: 'Gold',
}

const FIELD_CONFIG = [
  { key: 'age', label: 'Age', type: 'number', min: 18, max: 90 },
  { key: 'annual_income', label: 'Annual Income ($)', type: 'number', min: 0 },
  { key: 'spending_score', label: 'Spending Score (1–100)', type: 'number', min: 1, max: 100 },
  { key: 'previous_purchases', label: 'Previous Purchases', type: 'number', min: 0 },
  { key: 'avg_session_duration', label: 'Avg Session (min)', type: 'number', min: 0, step: 0.1 },
  { key: 'pages_visited', label: 'Pages Visited', type: 'number', min: 0 },
  { key: 'cart_abandonment_rate', label: 'Cart Abandonment Rate (0–1)', type: 'number', min: 0, max: 1, step: 0.01 },
  { key: 'days_since_last_purchase', label: 'Days Since Last Purchase', type: 'number', min: 0 },
  { key: 'email_open_rate', label: 'Email Open Rate (0–1)', type: 'number', min: 0, max: 1, step: 0.01 },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'device_type', label: 'Device Type', type: 'select', options: ['Mobile', 'Desktop', 'Tablet'] },
  { key: 'location', label: 'Location', type: 'select', options: ['Urban', 'Suburban', 'Rural'] },
  { key: 'membership_tier', label: 'Membership Tier', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Platinum'] },
]

export default function PredictBehavior() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [batchResult, setBatchResult] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: isNaN(v) ? v : Number(v) || v }))

  const handlePredict = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await predictAPI.behavior(form)
      setResult(res.data)
      toast.success('Prediction complete!')
    } catch (e) {
      if (e.message.includes('not trained')) {
        toast.error('Please train models first in the "Train Models" section.')
      } else {
        toast.error(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const onDrop = async ([file]) => {
    if (!file) return
    setBatchLoading(true)
    try {
      const res = await predictAPI.batch(file, 'behavior')
      setBatchResult(res.data)
      toast.success(`Batch complete: ${res.data.successful}/${res.data.total} predictions`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBatchLoading(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Customer Behavior Prediction</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Predict likelihood of purchase using customer attributes
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} style={{ color: '#4f6ef7' }} />
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Customer Attributes</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELD_CONFIG.map(({ key, label, type, options, ...rest }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
                {type === 'select' ? (
                  <select className="input-field text-xs" value={form[key]} onChange={e => handleChange(key, e.target.value)}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="input-field text-xs" type="number" value={form[key]}
                    onChange={e => handleChange(key, e.target.value)} {...rest} />
                )}
              </div>
            ))}
          </div>
          <button onClick={handlePredict} disabled={loading} className="btn-primary w-full justify-center mt-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Predicting...</> : <><BrainCircuit size={16} />Predict Behavior</>}
          </button>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <PredictionResult result={result} />
          ) : (
            <div className="card flex flex-col items-center justify-center py-14 text-center animate-fade-in">
              <BrainCircuit size={40} style={{ color: 'var(--text-muted)' }} className="mb-3 opacity-30" />
              <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>No prediction yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Fill in customer data and click Predict</p>
            </div>
          )}

          {/* Batch */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              <Upload size={14} className="inline mr-1.5" style={{ color: '#22d3ee' }} />
              Batch Prediction (CSV)
            </h3>
            <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
              style={{ borderColor: 'var(--border)' }}>
              <input {...getInputProps()} />
              {batchLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4f6ef7', borderTopColor: 'transparent' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Processing batch...</p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Drop a CSV file with customer records</p>
              )}
            </div>
            {batchResult && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <p className="text-xs font-semibold">Batch Results: {batchResult.successful}/{batchResult.total} successful</p>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {batchResult.results?.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>Row {i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        {r.status === 'success' ? (
                          <>
                            <span className={`badge ${r.will_purchase ? 'badge-success' : 'badge-danger'} text-xs`}>
                              {r.will_purchase ? 'Will Buy' : 'Will Not Buy'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.confidence}%</span>
                          </>
                        ) : (
                          <span className="badge badge-danger text-xs">Error</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PredictionResult({ result }) {
  const willBuy = result.will_purchase
  const confidence = result.confidence

  return (
    <div className="card space-y-4 animate-scale-in">
      {/* Main verdict */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${willBuy ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
            {willBuy ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
          </div>
          <div>
            <p className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>
              {willBuy ? 'Likely to Purchase' : 'Unlikely to Purchase'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Prediction: {result.prediction}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk' }}>{confidence}%</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</p>
        </div>
      </div>

      {/* Confidence gauge */}
      <div>
        <div className="progress-bar h-3">
          <div className="progress-fill" style={{
            width: `${confidence}%`,
            background: confidence > 75 ? 'linear-gradient(90deg, #10b981, #22d3ee)' :
              confidence > 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                'linear-gradient(90deg, #ef4444, #f87171)'
          }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Low</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>High Confidence</span>
        </div>
      </div>

      {/* Class probabilities */}
      {result.probabilities && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Class Probabilities</p>
          <div className="space-y-2">
            {Object.entries(result.probabilities).map(([cls, prob]) => (
              <div key={cls} className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0" style={{ color: 'var(--text-muted)' }}>Class {cls}</span>
                <div className="flex-1 progress-bar h-2">
                  <div className="progress-fill" style={{
                    width: `${prob}%`,
                    background: cls === '1' ? 'linear-gradient(90deg, #4f6ef7, #22d3ee)' : 'linear-gradient(90deg, #ef4444, #f87171)'
                  }} />
                </div>
                <span className="text-xs font-mono w-12 text-right">{prob}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="rounded-xl p-3.5" style={{
        background: willBuy ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${willBuy ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
      }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: willBuy ? '#10b981' : '#ef4444' }}>
          AI Insight
        </p>
        <p className="text-xs" style={{ color: 'var(--text)' }}>{result.insight}</p>
      </div>
    </div>
  )
}
