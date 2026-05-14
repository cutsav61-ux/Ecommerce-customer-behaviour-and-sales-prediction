import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Zap, Eye, EyeOff, LogIn } from 'lucide-react'
import { adminAPI } from '../utils/api'
import { useAuth, useTheme } from '../App'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await adminAPI.login(form)
      login(res.data.token)
      toast.success('Welcome back, Admin!')
      navigate('/admin')
    } catch (e) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4f6ef7, transparent)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }} />
      </div>

      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #4f6ef7, #22d3ee)', boxShadow: '0 8px 32px rgba(79,110,247,0.4)' }}>
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
            PredictIQ
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Admin Portal</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-bold text-base mb-5" style={{ fontFamily: 'Space Grotesk' }}>Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input className="input-field pl-10" type="text" placeholder="admin"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input className="input-field pl-10 pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                : <><LogIn size={16} />Sign In</>
              }
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'var(--surface-2)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Demo Credentials</p>
            <p style={{ color: 'var(--text-muted)' }}>Username: <code className="font-mono">admin</code></p>
            <p style={{ color: 'var(--text-muted)' }}>Password: <code className="font-mono">admin123</code></p>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          <a href="/" className="hover:underline" style={{ color: '#4f6ef7' }}>← Back to Dashboard</a>
        </p>
      </div>
    </div>
  )
}
