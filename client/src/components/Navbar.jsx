import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Search, Leaf, Bell, User, ChevronDown, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useLang } from '../contexts/LangContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount, badgeBounce } = useCart()
  const { lang, toggleLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'farmer') return '/farmer'
    if (user.role === 'delivery') return '/delivery'
    return '/profile'
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-primary-700 hidden sm:block">Farm2Door</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              />
            </div>
          </form>

          {/* Right */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Language toggle */}
            <button onClick={toggleLang} className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              <Globe className="w-4 h-4" />
              <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${badgeBounce ? 'cart-badge-bounce' : ''}`}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-xs">{user.name[0].toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium hidden md:block">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-48 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <Link to={getDashboardLink()} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" /> {t('dashboard')}
                    </Link>
                    <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <ShoppingCart className="w-4 h-4" /> {t('orders')}
                    </Link>
                    <button onClick={() => { logout(); setProfileOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <X className="w-4 h-4" /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">{t('login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('register')}</Link>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              />
            </div>
          </form>
        </div>

        {/* Categories bar */}
        <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
          {[['all','🛒 All'],['vegetables','🥕 Veggies'],['fruits','🍎 Fruits'],['dairy','🥛 Dairy'],['leafy','🌿 Leafy'],['grains','🌾 Grains'],['organic','🌱 Organic'],['herbs','🌿 Herbs']].map(([cat, label]) => (
            <Link key={cat} to={cat === 'all' ? '/products' : `/products?category=${cat}`}
              className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4">
          {[['/',t('home')],['/products',t('products')],['/orders',t('orders')],[ '/farmers',t('farmers')]].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium">{label}</Link>
          ))}
        </div>
      )}
    </nav>
  )
}
