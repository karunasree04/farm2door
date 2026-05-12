import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton, EmptyState } from '../components/UI'
import { useLang } from '../contexts/LangContext'
import { Package } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'All Categories', emoji: '🛒' },
  { value: 'vegetables', label: 'Vegetables', emoji: '🥕' },
  { value: 'fruits', label: 'Fruits', emoji: '🍎' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'leafy', label: 'Leafy Greens', emoji: '🌿' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'organic', label: 'Organic', emoji: '🌱' },
  { value: 'herbs', label: 'Herbs', emoji: '🌿' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
]

export default function ProductsPage() {
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || ''
  const isOrganic = searchParams.get('isOrganic') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search, sort, isOrganic, minPrice, maxPrice, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      if (isOrganic) params.set('isOrganic', isOrganic)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      params.set('page', page)
      params.set('limit', 20)
      return api.get(`/products?${params}`).then(r => r.data)
    },
    keepPreviousData: true
  })

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
    setPage(1)
  }

  const clearAll = () => { setSearchParams({}); setPage(1) }
  const hasFilters = !!(category || search || sort || isOrganic || minPrice || maxPrice)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 page-enter">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-64 shrink-0`}>
          <div className="card p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              {hasFilters && <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><X className="w-3 h-3" />Clear all</button>}
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} onClick={() => setParam('category', cat.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${category === cat.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min ₹" value={minPrice}
                  onChange={e => setParam('minPrice', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                <input type="number" placeholder="Max ₹" value={maxPrice}
                  onChange={e => setParam('maxPrice', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>

            {/* Organic toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isOrganic === 'true'}
                  onChange={e => setParam('isOrganic', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm text-gray-700">🌱 Organic only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden flex items-center gap-2 px-3 py-2 border rounded-xl text-sm">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
              <div className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `${data?.total || 0} products found`}
                {search && <span className="ml-1 font-medium">for "{search}"</span>}
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select value={sort} onChange={e => setParam('sort', e.target.value)}
                className="appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer">
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Active filters chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && <Chip label={CATEGORIES.find(c => c.value === category)?.label} onRemove={() => setParam('category', '')} />}
              {search && <Chip label={`"${search}"`} onRemove={() => setParam('search', '')} />}
              {isOrganic && <Chip label="Organic" onRemove={() => setParam('isOrganic', '')} />}
              {(minPrice || maxPrice) && <Chip label={`₹${minPrice || 0} - ₹${maxPrice || '∞'}`} onRemove={() => { setParam('minPrice', ''); setParam('maxPrice', '') }} />}
            </div>
          )}

          {/* Products grid */}
          {isLoading ? <ProductGridSkeleton count={12} /> : data?.products?.length === 0 ? (
            <EmptyState icon={Package} title={t('no_products')} subtitle="Try adjusting your filters or search term"
              action={<button onClick={clearAll} className="btn-primary">Clear Filters</button>} />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data?.products?.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {data?.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  {Array.from({ length: data.pages }, (_, i) => i+1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium ${page === p ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data?.pages}
                    className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-600"><X className="w-3 h-3" /></button>
    </span>
  )
}
