import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, TrendingUp, ShoppingBag, Star, Plus, Edit, Trash2, Check, X, Upload, BarChart2, Leaf, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import { StatusBadge, Spinner, PageLoader } from '../components/UI'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = { primary: 'bg-primary-50 text-primary-600', blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600' }
  return (
    <div className="card p-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function ProductFormModal({ product, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!product
  const [form, setForm] = useState({
    name: product?.name || '',
    nameTE: product?.nameTE || '',
    description: product?.description || '',
    category: product?.category || 'vegetables',
    basePrice: product?.basePrice || '',
    currentPrice: product?.currentPrice || '',
    stock: product?.stock || '',
    unit: product?.unit || 'kg',
    minOrderQuantity: product?.minOrderQuantity || 0.5,
    maxOrderQuantity: product?.maxOrderQuantity || 10,
    images: product?.images?.[0] || '',
    isOrganic: product?.isOrganic || false,
    isAvailable: product?.isAvailable ?? true,
    expiryDate: product?.expiryDate ? product.expiryDate.split('T')[0] : '',
    discount: product?.discount || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.basePrice || !form.stock) { toast.error('Name, price and stock are required'); return }
    setSaving(true)
    try {
      const payload = { ...form, images: form.images ? [form.images] : [], currentPrice: form.currentPrice || form.basePrice }
      if (isEdit) await api.put(`/products/${product._id}`, payload)
      else await api.post('/products', payload)
      qc.invalidateQueries(['farmer-products'])
      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const CATEGORIES = ['vegetables','fruits','dairy','leafy','grains','organic','herbs','other']
  const UNITS = ['kg','litre','bundle','piece','dozen','gram']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
              <input className="input-field" placeholder="e.g. Fresh Tomatoes" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Telugu Name</label>
              <input className="input-field" placeholder="తెలుగు పేరు" value={form.nameTE} onChange={e => setForm(p => ({ ...p, nameTE: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Describe your product..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit *</label>
              <select className="input-field" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (₹) *</label>
              <input type="number" min="0" className="input-field" placeholder="0.00" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Price (₹)</label>
              <input type="number" min="0" className="input-field" placeholder="Auto" value={form.currentPrice} onChange={e => setForm(p => ({ ...p, currentPrice: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount (%)</label>
              <input type="number" min="0" max="90" className="input-field" placeholder="0" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock *</label>
              <input type="number" min="0" className="input-field" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order</label>
              <input type="number" min="0" step="0.25" className="input-field" value={form.minOrderQuantity} onChange={e => setForm(p => ({ ...p, minOrderQuantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Order</label>
              <input type="number" min="0" className="input-field" value={form.maxOrderQuantity} onChange={e => setForm(p => ({ ...p, maxOrderQuantity: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
            <input className="input-field" placeholder="https://..." value={form.images} onChange={e => setForm(p => ({ ...p, images: e.target.value }))} />
            {form.images && <img src={form.images} alt="preview" className="mt-2 w-24 h-24 object-cover rounded-xl" onError={e => e.target.style.display='none'} />}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
            <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isOrganic} onChange={e => setForm(p => ({ ...p, isOrganic: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm text-gray-700">🌱 Organic Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm text-gray-700">Available for sale</span>
            </label>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <><Spinner size="sm" /> Saving...</> : <><Check className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Product</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FarmerDashboard() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['farmer-dashboard'],
    queryFn: () => api.get('/farmers/dashboard').then(r => r.data)
  })

  const { data: productsData, isLoading: prodLoading } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => api.get('/products?limit=100').then(r => r.data),
    enabled: tab === 'products'
  })

  const { data: ordersData } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => api.get('/orders/farmer').then(r => r.data),
    enabled: tab === 'orders'
  })

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      qc.invalidateQueries(['farmer-products'])
      toast.success('Product deleted')
    } catch (err) { toast.error('Failed to delete') }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/farmer/${orderId}/status`, { status })
      qc.invalidateQueries(['farmer-orders'])
      toast.success('Order status updated')
    } catch (err) { toast.error('Failed to update') }
  }

  const d = { ...(dashData?.stats || {}), recentOrders: dashData?.recentOrders || [] }
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      {showForm && <ProductFormModal product={editProduct} onClose={() => { setShowForm(false); setEditProduct(null) }} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌾 Farmer Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your products and orders</p>
        </div>
        {tab === 'products' && (
          <button onClick={() => { setEditProduct(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        dashLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Package} label="Total Products" value={d.totalProducts || 0} color="primary" />
              <StatCard icon={ShoppingBag} label="Total Orders" value={d.totalOrders || 0} color="blue" />
              <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${(d.totalRevenue || 0).toLocaleString('en-IN')}`} color="orange" />
              <StatCard icon={Star} label="Avg Rating" value={d.avgRating?.toFixed(1) || '—'} color="purple" />
            </div>

            {/* Recent orders */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
              {d.recentOrders?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {d.recentOrders?.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.orderId}</p>
                        <p className="text-xs text-gray-500">{order.items?.length} items • ₹{order.total}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="card p-5 border-l-4 border-primary-500">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900">AI Farming Insights</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { icon: '📈', title: 'Demand Alert', text: 'Tomatoes trending high this week. Consider stocking up.' },
                  { icon: '🌦️', title: 'Weather Advisory', text: 'Rain forecast in 3 days. Harvest leafy greens early.' },
                  { icon: '💰', title: 'Price Opportunity', text: 'Milk prices up 15%. Good time to sell dairy stock.' },
                ].map(insight => (
                  <div key={insight.title} className="bg-primary-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">{insight.icon}</div>
                    <p className="font-semibold text-sm text-primary-800">{insight.title}</p>
                    <p className="text-xs text-primary-700 mt-1">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        prodLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData?.products?.map(product => (
              <div key={product._id} className="card p-4">
                <div className="flex gap-3">
                  <img src={product.images?.[0]} alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">₹{product.currentPrice}/{product.unit}</span>
                      {product.discount > 0 && <span className="badge bg-red-100 text-red-700">-{product.discount}%</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${product.stock > 20 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        Stock: {product.stock}{product.unit}
                      </span>
                      {!product.isAvailable && <span className="badge bg-gray-100 text-gray-600">Hidden</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button onClick={() => { setEditProduct(product); setShowForm(true) }}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => deleteProduct(product._id)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {ordersData?.orders?.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No orders yet</div>
          ) : ordersData?.orders?.map(order => (
            <div key={order._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">#{order.orderId}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-600 mt-1">{order.customerId?.name} • {order.deliveryAddress?.city}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <span className="font-bold text-gray-900">₹{order.total}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {order.items?.map((item, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{item.name} ×{item.quantity}</span>
                ))}
              </div>
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateOrderStatus(order._id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-xl">
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button onClick={() => updateOrderStatus(order._id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-xl">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {order.status === 'confirmed' && (
                <button onClick={() => updateOrderStatus(order._id, 'packed')}
                  className="w-full text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 py-2 rounded-xl">
                  Mark as Packed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
