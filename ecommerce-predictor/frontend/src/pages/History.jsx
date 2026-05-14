import React, { useState, useEffect } from 'react'
import { History, Download, RefreshCw, Search, Filter, BrainCircuit, TrendingUp } from 'lucide-react'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await predictAPI.history(100)
      setHistory(res.data)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const filtered = history.filter(h => {
    if (filter !== 'all' && h.type !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return JSON.stringify(h).toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Prediction History</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All past predictions and results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchHistory} className="btn-secondary text-xs px-3 py-2 gap-1.5">
            <RefreshCw size={13} />Refresh
          </button>
          <button onClick={() => { predictAPI.exportCSV(); toast.success('Exporting CSV...') }}
            className="btn-primary text-xs px-3 py-2 gap-1.5">
            <Download size={13} />Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-slide-up">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9 text-sm" placeholder="Search predictions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {[['all', 'All'], ['classification', 'Behavior'], ['regression', 'Sales']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        {[
          { label: 'Total Predictions', value: history.length, icon: History, color: '#4f6ef7' },
          { label: 'Behavior Predictions', value: history.filter(h => h.type === 'classification').length, icon: BrainCircuit, color: '#22d3ee' },
          { label: 'Sales Predictions', value: history.filter(h => h.type === 'regression').length, icon: TrendingUp, color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${s.color}15` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card animate-slide-up overflow-hidden p-0">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
            {filtered.length} prediction{filtered.length !== 1 ? 's' : ''}
          </h3>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4f6ef7', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading history...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <History size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {history.length === 0 ? 'No predictions made yet' : 'No results match your filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['Type', 'Timestamp', 'Result', 'Confidence / Value', 'Insight'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                    <td className="px-4 py-3">
                      <span className={`badge ${item.type === 'classification' ? 'badge-info' : 'badge-cyan'}`}>
                        {item.type === 'classification' ? 'Behavior' : 'Sales'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.type === 'classification' ? (
                        <span className={`badge ${item.result?.will_purchase ? 'badge-success' : 'badge-danger'}`}>
                          {item.result?.will_purchase ? '✓ Will Buy' : '✗ Won\'t Buy'}
                        </span>
                      ) : (
                        <span className="font-semibold" style={{ color: '#22d3ee' }}>
                          ${item.result?.predicted_sales?.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>
                      {item.type === 'classification'
                        ? `${item.result?.confidence}%`
                        : item.result?.category}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.result?.insight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
