import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  // Not logged in at all → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Role restriction check
  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Give helpful redirect instead of blank "access denied"
    const homeByRole = {
      admin: '/admin',
      farmer: '/farmer',
      delivery: '/delivery',
      customer: '/',
    }
    const correctHome = homeByRole[user?.role] || '/'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wrong Dashboard</h2>
          <p className="text-gray-500 mb-1">
            You're logged in as <span className="font-semibold capitalize text-primary-600">{user?.role}</span>.
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            This page is for {roles.join(' or ')} accounts only.
          </p>
          <Link to={correctHome}
            className="btn-primary inline-flex items-center gap-2">
            Go to My Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return children
}
