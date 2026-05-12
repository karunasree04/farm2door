import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Star, MapPin, Award, Package, ShoppingBag, Leaf, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import { PageLoader, ProductGridSkeleton } from '../components/UI'
import ProductCard from '../components/ProductCard'

export function FarmersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['farmers'],
    queryFn: () => api.get('/farmers').then(r => r.data)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">🌾 Our Farmers</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Meet the dedicated farmers behind your fresh produce. Local, verified, and passionate about quality.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.farmers?.map(farmer => (
            <Link key={farmer._id} to={`/farmers/${farmer._id}`} className="card p-6 hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-green-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-2xl font-bold">{farmer.userId?.name?.[0] || 'F'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{farmer.farmName}</h3>
                  <p className="text-sm text-gray-500 capitalize">{farmer.userId?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{farmer.rating}</span>
                    <span className="text-xs text-gray-400">({farmer.totalOrders} orders)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                {farmer.location?.city}, {farmer.location?.state}
              </div>

              {farmer.description && <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{farmer.description}</p>}

              <div className="flex flex-wrap gap-2 mb-4">
                {farmer.certifications?.map(cert => (
                  <span key={cert} className="badge bg-green-100 text-green-700 capitalize">
                    <Award className="w-3 h-3 mr-1" />{cert}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">₹{(farmer.totalSales/1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">Total Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{farmer.crops?.length || 0}</p>
                  <p className="text-xs text-gray-500">Crop Types</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function FarmerProfilePage() {
  const { id } = useParams()

  const { data: farmerData, isLoading } = useQuery({
    queryKey: ['farmer', id],
    queryFn: () => api.get(`/farmers/${id}`).then(r => r.data)
  })

  const { data: productsData, isLoading: prodLoading } = useQuery({
    queryKey: ['farmer-prods', id],
    queryFn: () => api.get(`/products?farmerId=${id}`).then(r => r.data),
    enabled: !!id
  })

  if (isLoading) return <PageLoader />
  if (!farmerData?.farmer) return <div className="text-center py-20">Farmer not found</div>

  const f = farmerData.farmer

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      <Link to="/farmers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> All Farmers
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-green-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-4xl font-bold">{f.userId?.name?.[0] || 'F'}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{f.farmName}</h1>
                <p className="text-gray-500">{f.userId?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(f.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="font-medium text-gray-700">{f.rating}</span>
                  <span className="text-gray-400 text-sm">({f.totalOrders} orders)</span>
                </div>
              </div>
              {f.isVerified && (
                <span className="badge bg-blue-100 text-blue-700"><Award className="w-3 h-3 mr-1" />Verified Farmer</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-3 text-gray-600 text-sm">
              <MapPin className="w-4 h-4" /> {f.location?.address}, {f.location?.city}, {f.location?.state} - {f.location?.pincode}
            </div>
            {f.description && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{f.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          {[
            { icon: Package, label: 'Farm Size', value: f.farmSize || 'N/A' },
            { icon: ShoppingBag, label: 'Total Orders', value: f.totalOrders?.toLocaleString() },
            { icon: Star, label: 'Total Sales', value: `₹${(f.totalSales/1000).toFixed(0)}K` },
            { icon: Leaf, label: 'Est. Year', value: f.establishedYear || 'N/A' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
              <Icon className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className="font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Crops & Certs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {f.crops?.map(crop => (
            <span key={crop} className="badge bg-green-50 text-green-700 capitalize">{crop}</span>
          ))}
          {f.certifications?.map(cert => (
            <span key={cert} className="badge bg-blue-50 text-blue-700 capitalize"><Award className="w-3 h-3 mr-1" />{cert}</span>
          ))}
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Products by {f.farmName}</h2>
      {prodLoading ? <ProductGridSkeleton count={8} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productsData?.products?.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
      {!prodLoading && productsData?.products?.length === 0 && (
        <div className="text-center py-12 text-gray-400">No products listed yet</div>
      )}
    </div>
  )
}
