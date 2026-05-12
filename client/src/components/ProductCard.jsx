import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Minus, ShoppingCart, Star, Leaf, Zap } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useLang } from '../contexts/LangContext'

export default function ProductCard({ product }) {
  const { addToCart, updateQuantity, getQuantity, isInCart } = useCart()
  const { t, lang } = useLang()
  const [adding, setAdding] = useState(false)

  const qty = getQuantity(product._id)
  const inCart = isInCart(product._id)
  const name = lang === 'te' && product.nameTE ? product.nameTE : product.name
  const discountedPrice = product.discount > 0
    ? product.currentPrice * (1 - product.discount / 100)
    : product.currentPrice

  const daysToExpiry = product.expiryDate
    ? Math.floor((new Date(product.expiryDate) - Date.now()) / 86400000)
    : null

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    await addToCart(product._id, product.minOrderQuantity || 1)
    setAdding(false)
  }

  const handleInc = async (e) => {
    e.preventDefault()
    const step = product.unit === 'kg' || product.unit === 'litre' ? 0.25 : 1
    await updateQuantity(product._id, Math.min(qty + step, product.maxOrderQuantity))
  }

  const handleDec = async (e) => {
    e.preventDefault()
    const step = product.unit === 'kg' || product.unit === 'litre' ? 0.25 : 1
    const newQty = qty - step
    await updateQuantity(product._id, newQty <= 0 ? 0 : newQty)
  }

  return (
    <Link to={`/products/${product._id}`} className="card group hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' }}
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isOrganic && (
            <span className="badge bg-green-100 text-green-700"><Leaf className="w-3 h-3 mr-1" />{t('organic')}</span>
          )}
          {product.isTrending && (
            <span className="badge bg-orange-100 text-orange-700"><Zap className="w-3 h-3 mr-1" />Hot</span>
          )}
          {product.discount > 0 && (
            <span className="badge bg-red-100 text-red-700">-{product.discount}%</span>
          )}
          {daysToExpiry !== null && daysToExpiry <= 3 && daysToExpiry > 0 && (
            <span className="badge bg-yellow-100 text-yellow-700">{t('expiring_soon')}</span>
          )}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold text-sm px-3 py-1 rounded-full">{t('out_of_stock')}</span>
          </div>
        )}
        {product.stock > 0 && product.stock < 15 && (
          <div className="absolute bottom-2 left-2">
            <span className="badge bg-red-100 text-red-700">Only {product.stock} left!</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Farmer */}
        {product.farmerId?.farmName && (
          <p className="text-xs text-gray-400 mb-1 truncate">{product.farmerId.farmName}</p>
        )}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-600">{product.rating?.toFixed(1)} ({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1 mb-3 mt-auto">
          <span className="text-lg font-bold text-gray-900">₹{Math.round(discountedPrice)}</span>
          {product.discount > 0 && (
            <span className="text-sm text-gray-400 line-through">₹{product.currentPrice}</span>
          )}
          <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
        </div>

        {/* Cart Controls */}
        <div onClick={e => e.preventDefault()}>
          {product.stock === 0 ? (
            <button disabled className="w-full btn-primary opacity-50 text-sm py-2">{t('out_of_stock')}</button>
          ) : !inCart ? (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {adding ? 'Adding...' : t('add_to_cart')}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-primary-50 rounded-xl p-1">
              <button onClick={handleDec} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-primary-700 text-sm">
                {qty}{product.unit === 'kg' || product.unit === 'litre' ? product.unit : ''}
              </span>
              <button onClick={handleInc} className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
