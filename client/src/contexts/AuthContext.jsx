import { createContext, useContext, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// Safe parse localStorage - returns null on any error
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('f2d_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Validate it looks like a real user object
    if (!parsed || !parsed._id || !parsed.email || !parsed.role) return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(false)

  const saveSession = (token, userObj) => {
    localStorage.setItem('f2d_token', token)
    localStorage.setItem('f2d_user', JSON.stringify(userObj))
    setUser(userObj)
  }

  const clearSession = () => {
    localStorage.removeItem('f2d_token')
    localStorage.removeItem('f2d_user')
    setUser(null)
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      })
      if (!data.success || !data.token || !data.user) {
        throw new Error('Invalid response from server')
      }
      saveSession(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 🌱`)
      return data.user
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      toast.error(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (formData) => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
      }
      const { data } = await api.post('/auth/register', payload)
      if (!data.success || !data.token || !data.user) {
        throw new Error('Invalid response from server')
      }
      saveSession(data.token, data.user)
      toast.success(`Welcome to Farm2Door, ${data.user.name.split(' ')[0]}! 🎉`)
      return data.user
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    toast.success('Logged out. See you soon! 👋')
    // Hard redirect to home so all state resets
    window.location.href = '/'
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data.user) {
        setUser(data.user)
        localStorage.setItem('f2d_user', JSON.stringify(data.user))
      }
    } catch (err) {
      // Token expired or invalid — clear session
      if (err.response?.status === 401) {
        clearSession()
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
