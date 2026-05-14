import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, DollarSign, TrendingUp, Activity,
  Database, Brain, BarChart2, RefreshCw
} from 'lucide-react'
import { dashboardAPI } from '../utils/api'
import toast from 'react-hot-toast'

const COLORS = ['#4f6ef7', '#22d3ee', '#f59e0b', '#ef4444']

function StatCard({ icon: Icon, label, value, change, color, delay = 0 }) {
  return (
    <div className={`stat-card animate-slide-up stagger-${delay}`}
      style={{ '--card-color': color }}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change !== undefined && (
          <span className={`badge ${change >= 0 ? 'badge-success' : 'badge-danger'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
        {value}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <h3 className="font-semibold text-sm mb-5" style={{ color: 'var(--text)', fontFamily: 'Space Grotesk' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3" style={{ minWidth: 140 }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {p.name === 'revenue' ? `$${p.value?.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('daily')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await dashboardAPI.getStats()
      setStats(res.data)
    } catch (e) {
      toast.error('Failed to load dashboard: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <DashboardSkeleton />

  const chartData = period === 'daily' ? stats?.daily_data : stats?.weekly_data
  const xKey = period === 'daily' ? 'date' : 'week'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
            Analytics Overview
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time e-commerce intelligence
          </p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2 text-xs px-3 py-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Customers" value={stats?.total_customers?.toLocaleString()} change={8.2} color="#4f6ef7" delay={1} />
        <StatCard icon={DollarSign} label="Predicted Revenue" value={`$${(stats?.predicted_revenue / 1000).toFixed(1)}K`} change={12.5} color="#22d3ee" delay={2} />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats?.conversion_rate}%`} change={3.1} color="#10b981" delay={3} />
        <StatCard icon={Activity} label="Avg Order Value" value={`$${stats?.avg_order_value}`} change={-1.4} color="#f59e0b" delay={4} />
      </div>

      {/* Model Status */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Database, label: 'Datasets', value: stats?.active_datasets || 0, color: '#6366f1' },
          { icon: Brain, label: 'Models Trained', value: stats?.models_trained || 0, color: '#22d3ee' },
          { icon: BarChart2, label: 'Predictions Run', value: stats?.total_predictions || 0, color: '#10b981' },
        ].map((item, i) => (
          <div key={i} className="card flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${(i + 1) * 0.08}s` }}>
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${item.color}18` }}>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>{item.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend">
            <div className="flex gap-2 mb-4">
              {['daily', 'weekly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${period === p ? 'btn-primary' : 'btn-secondary'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#4f6ef7" strokeWidth={2} fill="url(#gradRevenue)" name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Segments pie */}
        <ChartCard title="Customer Segments">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats?.customer_segments} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="count" nameKey="segment" paddingAngle={3}>
                {stats?.customer_segments?.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} contentStyle={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px', fontSize: '12px'
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {stats?.customer_segments?.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.segment}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Customer & conversions bar */}
      <ChartCard title="Customers vs Conversions (Last 30 Days)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats?.daily_data?.slice(-14)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
            <Bar dataKey="customers" fill="#4f6ef7" radius={[4, 4, 0, 0]} name="customers" />
            <Bar dataKey="conversions" fill="#22d3ee" radius={[4, 4, 0, 0]} name="conversions" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-7 w-24 rounded-lg" />
            <div className="skeleton h-4 w-32 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="skeleton h-6 w-32 rounded-lg mb-4" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
        <div className="card">
          <div className="skeleton h-6 w-40 rounded-lg mb-4" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
