import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [] })
  const [cartMeta, setCartMeta] = useState({ subtotal: 0, deliveryFee: 30, taxes: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [badgeBounce, setBadgeBounce] = useState(false)

  const itemCount = cart.items?.length || 0

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [] }); setCartMeta({ subtotal: 0, deliveryFee: 30, taxes: 0, total: 0 }); return }
    try {
      const { data } = await api.get('/cart')
      if (data.success) {
        setCart(data.cart || { items: [] })
        setCartMeta({
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee ?? 30,
          taxes: data.taxes || 0,
          total: data.total || 0
        })
      }
    } catch (err) {
      if (err.response?.status !== 401) console.error('Cart fetch error:', err.message)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    if (!user) { toast.error('Please login to add items to cart'); return false }
    setLoading(true)
    try {
      await api.post('/cart/add', { productId, quantity })
      await fetchCart()
      setBadgeBounce(true)
      setTimeout(() => setBadgeBounce(false), 500)
      toast.success('Added to cart! 🛒')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
      return false
    } finally { setLoading(false) }
  }

  const updateQuantity = async (productId, quantity) => {
    if (!user) return
    try {
      await api.put('/cart/update', { productId, quantity })
      await fetchCart()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart')
    }
  }

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/cart/item/${productId}`)
      await fetchCart()
      toast.success('Item removed')
    } catch {}
  }

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear')
      setCart({ items: [] })
      setCartMeta({ subtotal: 0, deliveryFee: 30, taxes: 0, total: 0 })
    } catch {}
  }

  const isInCart = (productId) => {
    if (!productId) return false
    return cart.items?.some(i => {
      const id = i.productId?._id || i.productId
      return id?.toString() === productId?.toString()
    })
  }

  const getQuantity = (productId) => {
    if (!productId) return 0
    const item = cart.items?.find(i => {
      const id = i.productId?._id || i.productId
      return id?.toString() === productId?.toString()
    })
    return item?.quantity || 0
  }

  return (
    <CartContext.Provider value={{
      cart, cartMeta, itemCount, loading, badgeBounce,
      addToCart, updateQuantity, removeFromCart, clearCart,
      fetchCart, isInCart, getQuantity
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
