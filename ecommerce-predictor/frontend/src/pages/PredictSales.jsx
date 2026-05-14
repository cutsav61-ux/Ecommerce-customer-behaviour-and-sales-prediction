import React, { useState } from 'react'
import { TrendingUp, DollarSign, Target, Loader, AlertTriangle, Upload } from 'lucide-react'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DEFAULT_FORM = {
  age: 35,
  annual_income: 75000,
  spending_score: 68,
  previous_purchases: 10,
  avg_session_duration: 15,
  pages_visited: 20,
  cart_abandonment_rate: 0.18,
  days_since_last_purchase: 10,
  email_open_rate: 0.52,
  gender: 'Male',
  device_type: 'Desktop',
  location: 'Urban',
  membership_tier: 'Silver',
}

const SCENARIOS = [
  { label: 'High Value', data: { age: 42, annual_income: 150000, spending_score: 92, previous_purchases: 25, membership_tier: 'Platinum', device_type: 'Desktop', location: 'Urban', gender: 'Female', avg_session_duration: 25, pages_visited: 35, cart_abandonment_rate: 0.05, days_since_last_purchase: 3, email_open_rate: 0.8 } },
  { label: 'Mid Tier', data: { age: 30, annual_income: 60000, spending_score: 60, previous_purchases: 7, membership_tier: 'Silver', device_type: 'Mobile', location: 'Suburban', gender: 'Male', avg_session_duration: 10, pages_visited: 15, cart_abandonment_rate: 0.3, days_since_last_purchase: 20, email_open_rate: 0.4 } },
  { label: 'At Risk', data: { age: 55, annual_income: 35000, spending_score: 25, previous_purchases: 2, membership_tier: 'Bronze', device_type: 'Mobile', location: 'Rural', gender: 'Male', avg_session_duration: 3, pages_visited: 5, cart_abandonment_rate: 0.75, days_since_last_purchase: 120, email_open_rate: 0.1 } },
]

export default function PredictSales() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comparisons, setComparisons] = useState([])
  const [loadingScenario, setLoadingScenario] = useState(null)

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: isNaN(v) ? v : Number(v) || v }))

  const handlePredict = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await predictAPI.sales(form)
      setResult(res.data)
      toast.success('Sales prediction complete!')
    } catch (e) {
      if (e.message.includes('not trained')) {
        toast.error('Please train models first.')
      } else {
        toast.error(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const runScenario = async (scenario, idx) => {
    setLoadingScenario(idx)
    try {
      const res = await predictAPI.sales(scenario.data)
      setComparisons(c => {
        const existing = c.findIndex(x => x.label === scenario.label)
        const updated = [...c]
        if (existing >= 0) updated[existing] = { label: scenario.label, value: res.data.predicted_sales, category: res.data.category }
        else updated.push({ label: scenario.label, value: res.data.predicted_sales, category: res.data.category })
        return updated
      })
      toast.success(`${scenario.label} scenario complete: $${res.data.predicted_sales}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoadingScenario(null)
    }
  }

  const fields = [
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'annual_income', label: 'Annual Income ($)', type: 'number' },
    { key: 'spending_score', label: 'Spending Score', type: 'number' },
    { key: 'previous_purchases', label: 'Previous Purchases', type: 'number' },
    { key: 'avg_session_duration', label: 'Session Duration (min)', type: 'number', step: 0.1 },
    { key: 'pages_visited', label: 'Pages Visited', type: 'number' },
    { key: 'cart_abandonment_rate', label: 'Abandonment Rate', type: 'number', step: 0.01, min: 0, max: 1 },
    { key: 'days_since_last_purchase', label: 'Days Since Purchase', type: 'number' },
    { key: 'email_open_rate', label: 'Email Open Rate', type: 'number', step: 0.01, min: 0, max: 1 },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'device_type', label: 'Device', type: 'select', options: ['Mobile', 'Desktop', 'Tablet'] },
    { key: 'location', label: 'Location', type: 'select', options: ['Urban', 'Suburban', 'Rural'] },
    { key: 'membership_tier', label: 'Membership', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Platinum'] },
  ]

  const categoryColor = { High: '#10b981', Medium: '#f59e0b', Low: '#ef4444' }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Sales Forecast</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Predict expected revenue from individual customers
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} style={{ color: '#22d3ee' }} />
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Customer Profile</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ key, label, type, options, ...rest }) => (
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
          <button onClick={handlePredict} disabled={loading} className="btn-primary w-full justify-center mt-4">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Predicting...</> : <><TrendingUp size={16} />Predict Sales</>}
          </button>
        </div>

        {/* Result + scenarios */}
        <div className="space-y-4">
          {result ? (
            <div className="card animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${categoryColor[result.category]}18` }}>
                  <DollarSign size={20} style={{ color: categoryColor[result.category] }} />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk', color: categoryColor[result.category] }}>
                    ${result.predicted_sales?.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Predicted Sales Amount</p>
                </div>
                <span className={`badge ml-auto`} style={{
                  background: `${categoryColor[result.category]}18`,
                  color: categoryColor[result.category]
                }}>{result.category} Value</span>
              </div>

              <div className="rounded-xl p-3.5" style={{
                background: `${categoryColor[result.category]}0d`,
                border: `1px solid ${categoryColor[result.category]}30`
              }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: categoryColor[result.category] }}>AI Insight</p>
                <p className="text-xs" style={{ color: 'var(--text)' }}>{result.insight}</p>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp size={36} className="mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>No forecast yet</p>
            </div>
          )}

          {/* Scenario comparison */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              Quick Scenario Comparison
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SCENARIOS.map((s, i) => (
                <button key={s.label} onClick={() => runScenario(s, i)} disabled={loadingScenario !== null}
                  className="btn-secondary text-xs py-2 justify-center">
                  {loadingScenario === i ? <Loader size={12} className="animate-spin" /> : s.label}
                </button>
              ))}
            </div>
            {comparisons.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={comparisons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Predicted Sales']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {comparisons.map((c, i) => (
                      <Cell key={i} fill={categoryColor[c.category] || '#4f6ef7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
