import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Database, Brain, Trash2, RefreshCw, LogOut, Zap, Activity, BarChart2 } from 'lucide-react'
import { adminAPI } from '../utils/api'
import { useAuth, useTheme } from '../App'
import { useTheme as useThemeCtx } from '../App'
import toast from 'react-hot-toast'

export default function AdminPanel() {
  const [overview, setOverview] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const { logout } = useAuth()
  const { toggleTheme, theme } = useTheme()
  const navigate = useNavigate()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ov, ds] = await Promise.all([adminAPI.overview(), adminAPI.datasets()])
      setOverview(ov.data)
      setDatasets(ds.data)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this dataset?')) return
    try {
      await adminAPI.deleteDataset(id)
      setDatasets(d => d.filter(x => x.id !== id))
      toast.success('Dataset deleted')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Logged out')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f6ef7, #22d3ee)' }}>
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>PredictIQ Admin</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Control Panel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/" className="btn-secondary text-xs px-3 py-2">← Dashboard</a>
          <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-2 gap-1.5">
            <LogOut size={13} />Sign Out
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <Shield size={20} className="inline mr-2" style={{ color: '#4f6ef7' }} />
            Admin Overview
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4f6ef7', borderTopColor: 'transparent' }} />
            <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 animate-slide-up">
              {[
                { label: 'Total Predictions', value: overview?.total_predictions || 0, icon: Activity, color: '#4f6ef7' },
                { label: 'Datasets Uploaded', value: overview?.datasets || 0, icon: Database, color: '#22d3ee' },
                { label: 'Models Trained', value: Object.values(overview?.model_status || {}).filter(m => m.trained).length, icon: Brain, color: '#10b981' },
              ].map((s, i) => (
                <div key={i} className="card flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: `${s.color}15` }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{s.value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Model status */}
            <div className="card animate-slide-up">
              <h3 className="font-semibold text-sm mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                <Brain size={15} className="inline mr-2" style={{ color: '#4f6ef7' }} />
                Model Status
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(overview?.model_status || {}).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${status.trained ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span className="text-sm font-medium capitalize">{key}</span>
                    </div>
                    <div className="text-right">
                      {status.trained ? (
                        <>
                          <span className="badge badge-success text-xs">
                            {key === 'classification' ? `${status.accuracy}%` : `R² ${status.r2_score}%`}
                          </span>
                          {status.last_trained && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {new Date(status.last_trained).toLocaleDateString()}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="badge badge-warning text-xs">Not trained</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datasets */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                  <Database size={15} className="inline mr-2" style={{ color: '#22d3ee' }} />
                  Datasets ({datasets.length})
                </h3>
                <button onClick={fetchData} className="btn-secondary text-xs px-2.5 py-1.5 gap-1">
                  <RefreshCw size={12} />Refresh
                </button>
              </div>
              {datasets.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No datasets uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {datasets.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-xl transition-all"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {d.rows?.toLocaleString()} rows × {d.cols} cols · {new Date(d.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-info text-xs">{d.id.slice(0, 8)}...</span>
                        <button onClick={() => handleDelete(d.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System info */}
            <div className="card animate-slide-up">
              <h3 className="font-semibold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>System Info</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Python', overview?.system?.python_version?.split(' ')[0]],
                  ['Model Dir', overview?.system?.model_dir?.split('/').slice(-2).join('/')],
                ].map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className="font-semibold mt-0.5 truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
