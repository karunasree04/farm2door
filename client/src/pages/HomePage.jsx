import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Truck, Shield, Leaf, Clock, ArrowRight, Star } from 'lucide-react'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton, SectionHeader } from '../components/UI'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'

function HeroSection() {
  const { t } = useLang()
  const navigate = useNavigate()
  return (
    <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-green-500 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-yellow-400 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6">
              <span>🌱</span> Fresh from local Telangana farms
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              {t('hero_title')}
            </h1>
            <p className="text-lg text-green-100 mb-8 leading-relaxed">{t('hero_subtitle')}</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/products')} className="bg-white text-primary-700 font-bold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors flex items-center gap-2">
                {t('shop_now')} <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/farmers" className="border-2 border-white text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/10 transition-colors">
                Meet Our Farmers
              </Link>
            </div>
            <div className="flex gap-6 mt-10">
              {[['25+', 'Products'],['5', 'Local Farmers'],['1000+', 'Happy Customers'],['4.8★', 'Rating']].map(([num, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold">{num}</div>
                  <div className="text-green-200 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {['https://images.unsplash.com/photo-1542838132-92c53300491e?w=300','https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300','https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=300','https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=300'].map((src, i) => (
              <img key={i} src={src} alt="Farm produce" className={`rounded-2xl object-cover w-full h-36 shadow-xl ${i === 1 ? 'mt-6' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="py-12 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Delivery', sub: 'On orders above ₹500', color: 'text-blue-600 bg-blue-50' },
            { icon: Leaf, title: '100% Fresh', sub: 'Harvested daily', color: 'text-green-600 bg-green-50' },
            { icon: Shield, title: 'Quality Assured', sub: 'Farm-certified produce', color: 'text-purple-600 bg-purple-50' },
            { icon: Clock, title: 'Same Day', sub: 'Order by 10 AM', color: 'text-orange-600 bg-orange-50' },
          ].map(({ icon: Icon, title, sub, color }) => (
            <div key={title} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{title}</div>
                <div className="text-gray-500 text-xs">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategorySection() {
  const navigate = useNavigate()
  const cats = [
    { id: 'vegetables', label: 'Vegetables', emoji: '🥕', bg: 'from-orange-400 to-red-400' },
    { id: 'fruits', label: 'Fruits', emoji: '🍎', bg: 'from-pink-400 to-red-500' },
    { id: 'dairy', label: 'Dairy', emoji: '🥛', bg: 'from-blue-400 to-indigo-500' },
    { id: 'leafy', label: 'Leafy Greens', emoji: '🌿', bg: 'from-green-400 to-emerald-500' },
    { id: 'grains', label: 'Grains', emoji: '🌾', bg: 'from-yellow-400 to-amber-500' },
    { id: 'organic', label: 'Organic', emoji: '🌱', bg: 'from-teal-400 to-green-500' },
    { id: 'herbs', label: 'Herbs', emoji: '🌿', bg: 'from-lime-400 to-green-400' },
    { id: 'other', label: 'Other', emoji: '🛒', bg: 'from-purple-400 to-violet-500' },
  ]
  return (
    <section className="py-10 max-w-7xl mx-auto px-4">
      <SectionHeader title="Shop by Category" />
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {cats.map(cat => (
          <button key={cat.id} onClick={() => navigate(`/products?category=${cat.id}`)}
            className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${cat.bg} flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-200`}>
              {cat.emoji}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ProductSection({ title, queryKey, endpoint, viewAllCategory }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => api.get(endpoint).then(r => r.data)
  })

  return (
    <section className="py-8 max-w-7xl mx-auto px-4">
      <SectionHeader
        title={title}
        onViewAll={() => navigate(viewAllCategory ? `/products?category=${viewAllCategory}` : '/products')}
      />
      {isLoading ? <ProductGridSkeleton count={4} /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.products?.slice(0, 8).map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </section>
  )
}

function FarmerSpotlight() {
  const { data } = useQuery({
    queryKey: ['farmers'],
    queryFn: () => api.get('/farmers').then(r => r.data)
  })

  return (
    <section className="py-10 bg-green-50">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader title="🌾 Meet Our Farmers" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data?.farmers?.slice(0, 5).map(farmer => (
            <Link key={farmer._id} to={`/farmers/${farmer._id}`}
              className="card p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary-700">
                  {farmer.userId?.name?.[0] || 'F'}
                </span>
              </div>
              <p className="font-semibold text-sm text-gray-900 line-clamp-1">{farmer.farmName}</p>
              <p className="text-xs text-gray-500">{farmer.location?.city}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">{farmer.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function PreviouslyBought() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['previously-bought'],
    queryFn: () => api.get('/users/previously-bought').then(r => r.data),
    enabled: !!user
  })

  if (!user || (!isLoading && (!data?.products || data.products.length === 0))) return null

  return (
    <section className="py-8 max-w-7xl mx-auto px-4">
      <SectionHeader title="🔄 Buy Again" />
      {isLoading ? <ProductGridSkeleton count={4} /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.products?.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const { t } = useLang()

  return (
    <div className="page-enter">
      <HeroSection />
      <Features />
      <CategorySection />
      <ProductSection title={`⭐ ${t('featured')}`} queryKey="featured" endpoint="/products/featured" />
      <FarmerSpotlight />
      <ProductSection title={`🔥 ${t('trending')}`} queryKey="trending" endpoint="/products/trending" />
      <PreviouslyBought />
      <ProductSection title={`🏆 ${t('bestsellers')}`} queryKey="bestsellers" endpoint="/products/bestsellers" />
      <ProductSection title={`💡 ${t('recommended')}`} queryKey="recommended" endpoint="/products/recommended" />
    </div>
  )
}
