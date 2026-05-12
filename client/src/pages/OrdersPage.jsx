import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Package, MapPin, Clock, ChevronRight, Truck, Check, X } from 'lucide-react'
import api from '../utils/api'
import { StatusBadge, OrderSkeleton, EmptyState, PageLoader } from '../components/UI'
import { useLang } from '../contexts/LangContext'

export function OrdersPage() {
  const { t } = useLang()
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data)
  })

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('my_orders')}</h1>
      {[1,2,3].map(i => <OrderSkeleton key={i} />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('my_orders')}</h1>
      {!data?.orders?.length ? (
        <EmptyState icon={Package} title="No orders yet" subtitle="Place your first order and get fresh produce delivered!"
          action={<Link to="/products" className="btn-primary">Shop Now</Link>} />
      ) : (
        <div className="space-y-4">
          {data.orders.map(order => (
            <Link key={order._id} to={`/orders/${order._id}`} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">#{order.orderId}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-gray-900">₹{order.total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-hidden">
                {order.items?.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                    <span className="text-xs text-gray-700 font-medium">{item.name}</span>
                    <span className="text-xs text-gray-400">×{item.quantity}</span>
                  </div>
                ))}
                {order.items?.length > 3 && <span className="text-xs text-gray-400">+{order.items.length - 3} more</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Package className="w-3 h-3" /> {order.items?.length} items
                </div>
                <span className="text-xs text-primary-600 font-medium flex items-center gap-1">View details <ChevronRight className="w-3 h-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const TIMELINE = ['pending','confirmed','packed','assigned','out_for_delivery','delivered']

export function OrderDetailPage() {
  const { id } = useParams()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/my/${id}`).then(r => r.data)
  })

  if (isLoading) return <PageLoader />
  if (!data?.order) return <div className="text-center py-20">Order not found</div>

  const order = data.order
  const currentStep = TIMELINE.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600">← Orders</Link>
        <h1 className="text-xl font-bold text-gray-900">Order #{order.orderId}</h1>
      </div>

      {/* Status Timeline */}
      {!isCancelled ? (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="flex items-start">
            {TIMELINE.map((status, i) => (
              <div key={status} className="flex flex-col items-center flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 ${i < currentStep ? 'bg-primary-600 text-white' : i === currentStep ? 'border-2 border-primary-600 bg-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i === currentStep ? <div className="w-3 h-3 bg-primary-600 rounded-full" /> : <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
                <span className="text-xs text-center mt-2 text-gray-600 capitalize leading-tight" style={{ fontSize: '0.65rem' }}>{status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-xl">
              <Clock className="w-4 h-4 text-blue-500" />
              Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          {order.status === 'delivered' && order.actualDelivery && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
              <Check className="w-4 h-4" /> Delivered on {new Date(order.actualDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-4 mb-4 border-red-200">
          <div className="flex items-center gap-2 text-red-600"><X className="w-5 h-5" /><span className="font-semibold">Order Cancelled</span></div>
        </div>
      )}

      {/* Items */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Items ({order.items?.length})</h2>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <img src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} alt={item.name}
                className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.quantity}{item.unit} × ₹{item.priceAtOrder}</p>
              </div>
              <span className="font-semibold text-sm text-gray-900">₹{Math.round(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Bill Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span></div>
          <div className="flex justify-between text-gray-600"><span>Taxes</span><span>₹{order.taxes}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
          <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2"><span>Total Paid</span><span>₹{order.total}</span></div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{order.paymentMethod?.replace(/_/g, ' ')}</span>
          <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Address</h2>
        <p className="text-sm font-medium text-gray-900">{order.deliveryAddress?.name}</p>
        <p className="text-sm text-gray-600">{order.deliveryAddress?.phone}</p>
        <p className="text-sm text-gray-600">{order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}</p>
      </div>

      {/* Cancel button */}
      {['pending', 'confirmed'].includes(order.status) && (
        <button onClick={async () => {
          try {
            await api.put(`/orders/${order._id}/cancel`, { reason: 'Customer requested cancellation' })
            refetch()
          } catch (err) {
            alert(err.response?.data?.message || 'Cannot cancel order')
          }
        }} className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors">
          Cancel Order
        </button>
      )}
    </div>
  )
}
