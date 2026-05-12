// Skeleton loaders and shared UI

export function ProductSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-square w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-8 w-full rounded-xl mt-2" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <ProductSkeleton key={i} />)}
    </div>
  )
}

export function OrderSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="flex justify-between items-center mt-2">
        <div className="skeleton h-5 w-16 rounded" />
        <div className="skeleton h-8 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packed: 'bg-purple-100 text-purple-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`badge ${map[status] || 'bg-gray-100 text-gray-800'} capitalize`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm mb-6 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  )
}

export function SectionHeader({ title, viewAllLink, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {(viewAllLink || onViewAll) && (
        <button onClick={onViewAll} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View All →
        </button>
      )}
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${s} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4 text-sm">Loading...</p>
      </div>
    </div>
  )
}
