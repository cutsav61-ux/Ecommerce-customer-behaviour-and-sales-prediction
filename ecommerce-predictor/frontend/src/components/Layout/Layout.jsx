import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, TrendingUp, Upload,
  Cpu, History, Settings, Moon, Sun, Menu, X,
  ChevronRight, Zap, LogIn
} from 'lucide-react'
import { useTheme } from '../../App'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/dataset', icon: Upload, label: 'Upload Dataset' },
  { path: '/train', icon: Cpu, label: 'Train Models' },
  { separator: true, label: 'Predictions' },
  { path: '/predict/behavior', icon: BrainCircuit, label: 'Customer Behavior' },
  { path: '/predict/sales', icon: TrendingUp, label: 'Sales Forecast' },
  { path: '/history', icon: History, label: 'Prediction History' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:relative z-50 flex flex-col h-full w-64 flex-shrink-0
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #4f6ef7, #22d3ee)'
            }}>
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                PredictIQ
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Analytics</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-surface-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            if (item.separator) return (
              <div key={i} className="pt-4 pb-1 px-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {item.label}
                </p>
              </div>
            )
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                {location.pathname === item.path && (
                  <ChevronRight size={14} className="ml-auto opacity-60" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <NavLink
            to="/admin"
            className="sidebar-item"
            onClick={() => setSidebarOpen(false)}
          >
            <LogIn size={17} />
            <span>Admin Panel</span>
          </NavLink>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 flex-shrink-0" style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-colors hover:bg-opacity-10"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Space Grotesk' }}>
                {getPageTitle(location.pathname)}
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                E-commerce Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #4f6ef7, #22d3ee)' }}>
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function getPageTitle(path) {
  const titles = {
    '/': 'Dashboard',
    '/dataset': 'Upload Dataset',
    '/train': 'Train ML Models',
    '/predict/behavior': 'Customer Behavior Prediction',
    '/predict/sales': 'Sales Forecast',
    '/history': 'Prediction History',
    '/admin': 'Admin Panel',
  }
  return titles[path] || 'PredictIQ'
}
