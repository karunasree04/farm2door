import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Package, ShoppingBag, TrendingUp, BarChart2, Settings, Bell, Shield, Activity, RefreshCw, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../utils/api'
import { StatusBadge, Spinner } from '../components/UI'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, change, color }) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value}</p>
          {change && <p className={`text-xs mt-1 font-medium ${change > 0 ? 'text-green-600' : 'text-red-500'}`}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}% vs last week</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'pricing', label: 'Pricing', icon: TrendingUp },
  { id: 'agents', label: 'AI Agents', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const qc = useQueryClient()

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data)
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: tab === 'users'
  })

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    enabled: tab === 'orders'
  })

  const { data: agentsData } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: () => api.get('/admin/agent-logs').then(r => r.data),
    enabled: tab === 'agents'
  })

  const { data: pricingData } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => api.get('/pricing/rules').then(r => r.data),
    enabled: tab === 'pricing'
  })

  const toggleUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`)
      qc.invalidateQueries(['admin-users'])
      toast.success('User status updated')
    } catch { toast.error('Failed') }
  }

  const runAgent = async (agentType) => {
    try {
      await api.post('/agents/run', { agentType })
      qc.invalidateQueries(['admin-agents'])
      toast.success(`${agentType} agent executed`)
    } catch { toast.error('Agent failed') }
  }

  const d = { ...(dashData?.stats || {}), totalRevenue: dashData?.stats?.revenue?.total || 0, ordersByStatus: dashData?.ordersByStatus || [], usersByRole: [], revenueByDay: dashData?.last7Days || [], categoryBreakdown: dashData?.salesByCategory || [] }

  const revenueChartData = d.revenueByDay?.map(r => ({
    date: new Date(r._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: r.revenue
  })) || Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6-i)*86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: Math.floor(Math.random() * 5000) + 1000
  }))

  const categoryData = d.categoryBreakdown || [
    { _id: 'vegetables', count: 120 }, { _id: 'fruits', count: 85 },
    { _id: 'dairy', count: 60 }, { _id: 'leafy', count: 45 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👑 Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Farm2Door Control Center</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => qc.invalidateQueries()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={d.totalUsers || 0} change={12} color="blue" />
              <StatCard icon={Package} label="Total Products" value={d.totalProducts || 0} change={5} color="green" />
              <StatCard icon={ShoppingBag} label="Total Orders" value={d.totalOrders || 0} change={8} color="orange" />
              <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${((d.totalRevenue || 0)/1000).toFixed(1)}K`} change={15} color="purple" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4">Revenue Trend (7 Days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4">Orders by Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">Order Status Breakdown</h3>
                <div className="space-y-2">
                  {(d.ordersByStatus || []).map(s => (
                    <div key={s._id} className="flex items-center justify-between">
                      <StatusBadge status={s._id} />
                      <span className="font-semibold text-gray-900">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">User Breakdown</h3>
                <div className="space-y-2">
                  {(d.usersByRole || []).map(r => (
                    <div key={r._id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{r._id === 'customer' ? '🛒' : r._id === 'farmer' ? '🌾' : r._id === 'delivery' ? '🚚' : '👑'} {r._id}</span>
                      <span className="font-semibold text-gray-900">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{usersData?.users?.length || 0} total users</p>
          </div>
          {usersData?.users?.map(user => (
            <div key={user._id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold">{user.name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email} • {user.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'farmer' ? 'bg-green-100 text-green-700' : user.role === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{user.role}</span>
                <button onClick={() => toggleUser(user._id)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {ordersData?.orders?.map(order => (
            <div key={order._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm">#{order.orderId}</p>
                  <p className="text-xs text-gray-500">{order.customerId?.name} • {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-bold text-gray-900">₹{order.total}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.paymentMethod?.replace(/_/g, ' ')} • {order.paymentStatus}
                </span>
                <span className="text-xs text-gray-500">{order.items?.length} items</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Engine */}
      {tab === 'pricing' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-600" /> Smart Pricing Engine</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Demand Surge Rule', desc: 'Price increases when demand > supply by 80%', active: true, color: 'orange' },
                { label: 'Expiry Discount', desc: 'Auto 25% off when expiry within 3 days', active: true, color: 'yellow' },
                { label: 'Anti-Hoarding', desc: 'Max order limit enabled on low stock', active: true, color: 'red' },
              ].map(rule => (
                <div key={rule.label} className={`p-4 rounded-xl border-2 ${rule.active ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-900">{rule.label}</span>
                    <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-gray-600">{rule.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Pricing Logic</h3>
              <div className="space-y-2 font-mono text-xs text-gray-700">
                <div className="bg-white p-2 rounded-lg">IF demand &gt; supply → increase price (within ceiling)</div>
                <div className="bg-white p-2 rounded-lg">IF supply &gt; demand → decrease price (above base)</div>
                <div className="bg-white p-2 rounded-lg">IF days_to_expiry ≤ 3 → apply 25% auto discount</div>
                <div className="bg-white p-2 rounded-lg">IF stock &lt; 15 → enable anti-hoarding limits</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Price Floor & Ceiling Control</h2>
              <button onClick={async () => {
                try { await api.post('/pricing/run-engine'); toast.success('Pricing engine executed!') }
                catch { toast.error('Failed to run engine') }
              }} className="btn-primary text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Run Engine Now
              </button>
            </div>
            <p className="text-sm text-gray-500">The smart pricing engine runs automatically every hour. Use the button above to trigger it manually.</p>
          </div>
        </div>
      )}

      {/* AI Agents */}
      {tab === 'agents' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'pricing', name: 'Pricing Agent', desc: 'Adjusts prices based on demand/supply', icon: '💰' },
              { type: 'demand_forecast', name: 'Demand Forecast Agent', desc: 'Predicts future demand patterns', icon: '📈' },
              { type: 'logistics', name: 'Logistics Agent', desc: 'Optimizes delivery assignments', icon: '🚚' },
              { type: 'farmer_advisory', name: 'Farmer Advisory Agent', desc: 'Provides crop & pricing advice', icon: '🌾' },
              { type: 'waste_reduction', name: 'Waste Reduction Agent', desc: 'Flags expiring products for discount', icon: '♻️' },
              { type: 'recommendation', name: 'Recommendation Agent', desc: 'Generates personalized recommendations', icon: '⭐' },
            ].map(agent => (
              <div key={agent.type} className="card p-4">
                <div className="text-3xl mb-2">{agent.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{agent.name}</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">{agent.desc}</p>
                <button onClick={() => runAgent(agent.type)} className="w-full btn-primary text-xs py-2">Run Now</button>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4">Agent Execution Logs</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {agentsData?.logs?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No logs yet. Run an agent to see logs.</p>
              ) : agentsData?.logs?.map(log => (
                <div key={log._id} className={`flex items-start gap-3 p-3 rounded-xl ${log.success === true ? 'bg-green-50' : log.success === false ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.success === true ? 'bg-green-500' : log.success === false ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 capitalize">{log.agentName?.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{log.explanation || log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Broadcast Notification</h2>
            <BroadcastForm />
          </div>
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5" /> Platform Controls</h2>
            <div className="space-y-3">
              {[
                { label: 'Anti-Hoarding Mode', desc: 'Limit max quantity per order on high-demand products' },
                { label: 'Discount Mode', desc: 'Enable flash sales across all categories' },
                { label: 'Smart Pricing Auto-Run', desc: 'Run pricing engine every hour automatically' },
              ].map(ctrl => (
                <div key={ctrl.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ctrl.label}</p>
                    <p className="text-xs text-gray-500">{ctrl.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BroadcastForm() {
  const [form, setForm] = useState({ title: '', message: '', type: 'info' })
  const [sending, setSending] = useState(false)
  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    setSending(true)
    try {
      await api.post('/admin/notifications/broadcast', form)
      toast.success('Notification sent to all users!')
      setForm({ title: '', message: '', type: 'info' })
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }
  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="Notification title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      <textarea className="input-field resize-none" rows={3} placeholder="Message..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
      <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
        {['info','order','price_alert','promotion'].map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button onClick={handleSend} disabled={sending} className="btn-primary w-full">
        {sending ? 'Sending...' : '📢 Broadcast to All Users'}
      </button>
    </div>
  )
}
