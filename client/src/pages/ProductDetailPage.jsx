import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Leaf, Shield, Truck, Plus, Minus, ShoppingCart, ArrowLeft, Zap, MapPin, Package } from 'lucide-react'
import api from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { useLang } from '../contexts/LangContext'
import ProductCard from '../components/ProductCard'
import { PageLoader, StatusBadge } from '../components/UI'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { addToCart, updateQuantity, getQuantity, isInCart } = useCart()
  const [activeImg, setActiveImg] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data)
  })
  const { data: related } = useQuery({
    queryKey: ['related', id],
    queryFn: () => api.get(`/products/${id}/related`).then(r => r.data)
  })

  if (isLoading) return <PageLoader />
  if (!data?.product) return <div className="text-center py-20">Product not found</div>

  const p = data.product
  const name = lang === 'te' && p.nameTE ? p.nameTE : p.name
  const desc = lang === 'te' && p.descriptionTE ? p.descriptionTE : p.description
  const qty = getQuantity(p._id)
  const inCart = isInCart(p._id)
  const step = p.unit === 'kg' || p.unit === 'litre' ? 0.25 : 1
  const discountedPrice = p.discount > 0 ? p.currentPrice * (1 - p.discount / 100) : p.currentPrice
  const daysToExpiry = p.expiryDate ? Math.floor((new Date(p.expiryDate) - Date.now()) / 86400000) : null

  const handleAdd = async () => {
    const ok = await addToCart(p._id, p.minOrderQuantity || 1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
            <img src={p.images?.[activeImg] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'}
              alt={name} className="w-full h-full object-cover"
              onError={e => e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'} />
          </div>
          {p.images?.length > 1 && (
            <div className="flex gap-2">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-primary-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {p.isOrganic && <span className="badge bg-green-100 text-green-700"><Leaf className="w-3 h-3 mr-1" />Organic</span>}
            {p.isTrending && <span className="badge bg-orange-100 text-orange-700"><Zap className="w-3 h-3 mr-1" />Trending</span>}
            {p.isFeatured && <span className="badge bg-purple-100 text-purple-700">Featured</span>}
            {daysToExpiry !== null && daysToExpiry <= 3 && daysToExpiry > 0 && (
              <span className="badge bg-yellow-100 text-yellow-700">⚡ Expiring in {daysToExpiry} day{daysToExpiry > 1 ? 's' : ''}</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{name}</h1>

          {/* Farmer */}
          {p.farmerId && (
            <Link to={`/farmers/${p.farmerId._id}`} className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{p.farmerId.farmName}</span>
              {p.farmerId.location?.city && <span className="text-gray-500">• {p.farmerId.location.city}</span>}
            </Link>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(p.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{p.rating?.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({p.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-extrabold text-gray-900">₹{Math.round(discountedPrice)}</span>
            {p.discount > 0 && <span className="text-xl text-gray-400 line-through">₹{p.currentPrice}</span>}
            <span className="text-gray-500">/{p.unit}</span>
          </div>
          {p.discount > 0 && (
            <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              🎉 You save ₹{Math.round(p.currentPrice - discountedPrice)} ({p.discount}% off)
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-medium ${p.stock > 20 ? 'text-green-600' : p.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {p.stock > 20 ? 'In Stock' : p.stock > 0 ? `Only ${p.stock}${p.unit} left!` : 'Out of Stock'}
            </span>
            <span className="text-xs text-gray-400">• Min: {p.minOrderQuantity}{p.unit} • Max: {p.maxOrderQuantity}{p.unit}</span>
          </div>

          {/* Cart */}
          <div className="mb-6">
            {p.stock === 0 ? (
              <button disabled className="w-full btn-primary opacity-50 py-4 text-base">{t('out_of_stock')}</button>
            ) : !inCart ? (
              <button onClick={handleAdd} className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> {t('add_to_cart')}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-primary-50 rounded-2xl p-2 gap-4">
                  <button onClick={() => updateQuantity(p._id, Math.max(0, qty - step))}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow hover:text-red-600 transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-bold text-primary-700 min-w-[60px] text-center">{qty}{p.unit === 'kg' || p.unit === 'litre' ? p.unit : ''}</span>
                  <button onClick={() => updateQuantity(p._id, Math.min(qty + step, p.maxOrderQuantity))}
                    className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <Link to="/cart" className="btn-secondary py-3 flex-1 text-center">Go to Cart →</Link>
              </div>
            )}
          </div>

          {/* Assurances */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl">
            {[{ icon: Leaf, text: '100% Fresh' }, { icon: Shield, text: 'Quality Guaranteed' }, { icon: Truck, text: 'Fast Delivery' }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center text-center gap-1">
                <Icon className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {desc && (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900 mb-2">About this product</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          )}

          {/* Nutritional info */}
          {p.nutritionalInfo && Object.values(p.nutritionalInfo).some(v => v) && (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900 mb-2">Nutritional Info (per 100g)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[['Calories', p.nutritionalInfo.calories, 'kcal'], ['Protein', p.nutritionalInfo.protein, 'g'], ['Carbs', p.nutritionalInfo.carbs, 'g'], ['Fat', p.nutritionalInfo.fat, 'g'], ['Fiber', p.nutritionalInfo.fiber, 'g']].map(([label, val, unit]) => val ? (
                  <div key={label} className="text-center p-2 bg-gray-50 rounded-xl">
                    <div className="text-sm font-bold text-gray-900">{val}{unit}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related?.products?.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.products.slice(0, 4).map(rp => <ProductCard key={rp._id} product={rp} />)}
          </div>
        </section>
      )}
    </div>
  )
}
