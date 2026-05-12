import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, Tag, Truck, ArrowRight } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useLang } from '../contexts/LangContext'
import { EmptyState } from '../components/UI'

export default function CartPage() {
  const { cart, cartMeta, updateQuantity, removeFromCart, clearCart, loading } = useCart()
  const { t } = useLang()
  const navigate = useNavigate()

  const items = cart?.items?.filter(i => i.productId) || []

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title={t('empty_cart')}
          subtitle="Add fresh farm produce to your cart and get same-day delivery!"
          action={<Link to="/products" className="btn-primary">Browse Products</Link>}
        />
      </div>
    )
  }

  const freeDeliveryThreshold = 500
  const remaining = Math.max(0, freeDeliveryThreshold - cartMeta.subtotal)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('your_cart')} ({items.length} items)</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
          <Trash2 className="w-4 h-4" /> Clear All
        </button>
      </div>

      {remaining > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
          <Truck className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700">
            Add <span className="font-bold">₹{Math.round(remaining)}</span> more for <span className="font-bold text-green-600">FREE delivery</span>! 🎉
          </p>
          <div className="flex-1 bg-orange-200 rounded-full h-1.5 ml-2">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (cartMeta.subtotal / freeDeliveryThreshold) * 100)}%` }} />
          </div>
        </div>
      )}
      {remaining === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-6 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">🎉 You've got FREE delivery!</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const product = item.productId
            if (!product) return null
            const step = product.unit === 'kg' || product.unit === 'litre' ? 0.25 : 1
            const discountedPrice = product.discount > 0 ? product.currentPrice * (1 - product.discount / 100) : product.currentPrice
            return (
              <div key={item._id || product._id} className="card p-4 flex gap-4">
                <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200'}
                  alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0"
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200'} />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product._id}`} className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 text-sm">{product.name}</Link>
                  {product.farmerId?.farmName && <p className="text-xs text-gray-400 mt-0.5">{product.farmerId.farmName}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-gray-900">₹{Math.round(discountedPrice)}</span>
                    {product.discount > 0 && <span className="text-xs text-gray-400 line-through">₹{product.currentPrice}</span>}
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  </div>
                  {product.stock > 0 && product.stock < 10 && (
                    <p className="text-xs text-red-500 mt-0.5">Only {product.stock} left!</p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  {/* Quantity controls */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-1">
                    <button onClick={() => {
                      const newQty = item.quantity - step
                      if (newQty <= 0) removeFromCart(product._id)
                      else updateQuantity(product._id, newQty)
                    }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-12 text-center">{item.quantity}{product.unit === 'kg' || product.unit === 'litre' ? product.unit : ''}</span>
                    <button onClick={() => {
                      if (item.quantity >= product.maxOrderQuantity) return
                      updateQuantity(product._id, item.quantity + step)
                    }} className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Item total */}
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">₹{Math.round(discountedPrice * item.quantity)}</span>
                  </div>
                  <button onClick={() => removeFromCart(product._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{t('summary')}</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('subtotal')} ({items.length} items)</span>
                <span className="font-medium">₹{Math.round(cartMeta.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('delivery')}</span>
                <span className={cartMeta.deliveryFee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {cartMeta.deliveryFee === 0 ? '🎉 FREE' : `₹${cartMeta.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('taxes')} (5%)</span>
                <span className="font-medium">₹{Math.round(cartMeta.taxes)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-900">{t('total')}</span>
                <span className="font-extrabold text-xl text-primary-700">₹{Math.round(cartMeta.total)}</span>
              </div>
            </div>

            <button onClick={() => navigate('/checkout')} className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2">
              {t('checkout')} <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 justify-center">
              <Tag className="w-3 h-3" /> Secure checkout • No hidden charges
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
