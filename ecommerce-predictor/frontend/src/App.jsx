import React, { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import PredictBehavior from './pages/PredictBehavior'
import PredictSales from './pages/PredictSales'
import UploadDataset from './pages/UploadDataset'
import TrainModel from './pages/TrainModel'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import History from './pages/History'

// ── Theme Context ─────────────────────────────────────────────────────────────
export const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

// ── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  
  const login = (t) => { setToken(t); localStorage.setItem('admin_token', t) }
  const logout = () => { setToken(null); localStorage.removeItem('admin_token') }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ token, login, logout }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#1e293b' : '#ffffff',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '12px',
              fontFamily: 'DM Sans, system-ui',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            },
          }}
        />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/predict/behavior" element={<PredictBehavior />} />
            <Route path="/predict/sales" element={<PredictSales />} />
            <Route path="/dataset" element={<UploadDataset />} />
            <Route path="/train" element={<TrainModel />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
