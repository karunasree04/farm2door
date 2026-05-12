import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

function InputField({ icon: Icon, type = 'text', placeholder, value, onChange, error, rightElement }) {
  return (
    <div>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : 'pr-4'} py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  )
}

export function LoginPage() {
  const { login, loading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  // Only use `from` if it's a safe customer page, not a role-locked dashboard
  const rawFrom = location.state?.from || '/'
  const safePagesForCustomer = ['/', '/products', '/cart', '/orders', '/profile', '/farmers']
  const isCustomerSafe = safePagesForCustomer.some(p => rawFrom === p || rawFrom.startsWith('/products') || rawFrom.startsWith('/orders') || rawFrom.startsWith('/farmers'))

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password)
      // Route based on role — never send customer to a dashboard
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'farmer') navigate('/farmer', { replace: true })
      else if (user.role === 'delivery') navigate('/delivery', { replace: true })
      else {
        // customer — go back to where they were if safe, else home
        navigate(isCustomerSafe ? rawFrom : '/', { replace: true })
      }
    } catch {}
  }

  const demoLogin = (email) => {
    setForm({ email, password: 'Password@123' })
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Farm2Door account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              icon={Mail} placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              error={errors.email}
            />
            <InputField
              icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password}
              rightElement={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
              🚀 One-click demo login (password: <span className="font-mono">Password@123</span>)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👑 Admin',    email: 'admin@farm2door.com'    },
                { label: '🛒 Customer', email: 'customer@farm2door.com' },
                { label: '🌾 Farmer',   email: 'ramesh@farm2door.com'   },
                { label: '🚚 Delivery', email: 'delivery@farm2door.com' },
              ].map(d => (
                <button key={d.email} onClick={() => demoLogin(d.email)}
                  className="text-xs bg-white border border-gray-200 rounded-lg py-2 px-2 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors text-left font-medium">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'customer' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain uppercase letter'
    else if (!/[a-z]/.test(form.password)) e.password = 'Must contain lowercase letter'
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Invalid 10-digit Indian mobile'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const { confirmPassword, ...payload } = form
      payload.email = payload.email.trim().toLowerCase()
      payload.name = payload.name.trim()
      const user = await register(payload)
      if (user.role === 'farmer') navigate('/farmer', { replace: true })
      else if (user.role === 'delivery') navigate('/delivery', { replace: true })
      else navigate('/', { replace: true })
    } catch {}
  }

  const pwChecks = [
    [/.{8,}/, 'At least 8 characters'],
    [/[A-Z]/, 'One uppercase letter'],
    [/[a-z]/, 'One lowercase letter'],
    [/[0-9]/, 'One number'],
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Farm2Door today — it's free</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField icon={User} placeholder="Full Name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} />
            <InputField icon={Mail} placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} />
            <InputField icon={Phone} placeholder="Phone number (optional)" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} error={errors.phone} />
            <InputField icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Create password"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password}
              rightElement={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <InputField icon={Lock} type="password" placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              error={errors.confirmPassword} />

            {/* Password strength */}
            {form.password && (
              <div className="grid grid-cols-2 gap-1">
                {pwChecks.map(([regex, label]) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs ${regex.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${regex.test(form.password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Role selector */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">I want to join as...</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'customer', label: '🛒 Customer' },
                  { v: 'farmer',   label: '🌾 Farmer'   },
                  { v: 'delivery', label: '🚚 Delivery'  },
                ].map(r => (
                  <button key={r.v} type="button"
                    onClick={() => setForm(p => ({ ...p, role: r.v }))}
                    className={`py-2 px-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.role === r.v
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
