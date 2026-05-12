import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Check, X, Navigation, Package, Clock, Truck } from 'lucide-react'
import api from '../utils/api'
import { StatusBadge, Spinner } from '../components/UI'
import toast from 'react-hot-toast'

export default function DeliveryDashboard() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('active')

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-orders', tab],
    queryFn: () => api.get(`/delivery/orders?status=${tab}`).then(r => r.data),
    refetchInterval: 30000
  })

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status, note: `Status updated to ${status} by delivery partner` })
      qc.invalidateQueries(['delivery-orders'])
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
  }

  const updateLocation = async (orderId) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.put(`/delivery/location/${orderId}`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
        toast.success('Location updated!')
      } catch { toast.error('Failed to update location') }
    }, () => {
      // Simulate location for demo
      api.put(`/delivery/location/${orderId}`, { lat: 17.4484, lng: 78.3915 })
        .then(() => toast.success('Location simulated!'))
    })
  }

  const orders = data?.orders || []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">🚚 Delivery Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your deliveries</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Today's", value: data?.todayCount || 0, icon: Package },
          { label: 'Pending', value: data?.pendingCount || 0, icon: Clock },
          { label: 'Delivered', value: data?.deliveredCount || 0, icon: Check },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <s.icon className="w-5 h-5 text-primary-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-4">
        {[{ id: 'active', label: 'Active' }, { id: 'delivered', label: 'Delivered' }, { id: 'all', label: 'All Orders' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No orders in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">#{order.orderId}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl mb-3">
                <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.deliveryAddress?.name}</p>
                  <p className="text-xs text-gray-600">{order.deliveryAddress?.phone}</p>
                  <p className="text-xs text-gray-600">{order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}</p>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-1 mb-3">
                {order.items?.map((item, i) => (
                  <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{item.name} ×{item.quantity}</span>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">₹{order.total}</span>
                <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.paymentMethod?.replace(/_/g, ' ').toUpperCase()} • {order.paymentStatus}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {order.status === 'assigned' && (
                  <button onClick={() => updateStatus(order._id, 'out_for_delivery')}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl font-medium">
                    <Truck className="w-4 h-4" /> Start Delivery
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <>
                    <button onClick={() => updateLocation(order._id)}
                      className="flex items-center justify-center gap-1 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 px-3 rounded-xl">
                      <Navigation className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateStatus(order._id, 'delivered')}
                      className="flex-1 flex items-center justify-center gap-1 text-sm text-green-700 bg-green-50 hover:bg-green-100 py-2.5 rounded-xl font-medium">
                      <Check className="w-4 h-4" /> Mark Delivered
                    </button>
                  </>
                )}
                {order.status === 'delivered' && (
                  <div className="flex-1 flex items-center justify-center gap-1 text-sm text-green-600 bg-green-50 py-2.5 rounded-xl">
                    <Check className="w-4 h-4" /> Delivered ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
