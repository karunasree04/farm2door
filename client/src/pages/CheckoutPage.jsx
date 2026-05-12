import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, CreditCard, Check, ChevronRight, Home, Briefcase } from 'lucide-react'
import api from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import toast from 'react-hot-toast'
import { Spinner } from '../components/UI'

const STEPS = ['Address', 'Payment', 'Review']

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cart, cartMeta, clearCart } = useCart()
  const { t } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [newAddress, setNewAddress] = useState({ name: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: 'Telangana', pincode: '', label: 'home' })
  const [useNew, setUseNew] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)

  const { data: addrData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data)
  })

  const addresses = addrData?.addresses || []
  const items = cart?.items?.filter(i => i.productId) || []

  const handlePlaceOrder = async () => {
    const deliveryAddress = useNew || addresses.length === 0 ? newAddress : addresses.find(a => a._id === selectedAddress) || addresses[0]
    if (!deliveryAddress?.addressLine1) { toast.error('Please add a delivery address'); return }

    setPlacing(true)
    try {
      const orderItems = items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
      }))

      const { data: orderData } = await api.post('/orders', {
        items: orderItems,
        deliveryAddress: {
          name: deliveryAddress.name,
          phone: deliveryAddress.phone,
          addressLine1: deliveryAddress.addressLine1,
          addressLine2: deliveryAddress.addressLine2 || '',
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
        },
        paymentMethod,
        specialInstructions: ''
      })

      if (paymentMethod === 'cod') {
        await api.post('/payments/create', { orderId: orderData.order._id, method: 'cod', amount: orderData.order.total })
      } else {
        // Mock UPI/Card payment
        const { data: payData } = await api.post('/payments/create', { orderId: orderData.order._id, method: paymentMethod })
        await api.post('/payments/verify', { paymentId: payData.payment._id, orderId: orderData.order._id, gatewayPaymentId: `mock_${Date.now()}` })
      }

      await clearCart()
      toast.success('Order placed successfully! 🎉')
      navigate(`/orders/${orderData.order._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally { setPlacing(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < step ? 'bg-primary-600 text-white' : i === step ? 'border-2 border-primary-600 text-primary-600' : 'border-2 border-gray-200 text-gray-400'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" /> Delivery Address</h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map(addr => (
                    <label key={addr._id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${!useNew && selectedAddress === addr._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={!useNew && selectedAddress === addr._id} onChange={() => { setSelectedAddress(addr._id); setUseNew(false) }} className="mt-1 accent-primary-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          {addr.label === 'home' ? <Home className="w-4 h-4 text-gray-400" /> : <Briefcase className="w-4 h-4 text-gray-400" />}
                          <span className="font-medium text-sm capitalize">{addr.label}</span>
                          {addr.isDefault && <span className="badge bg-green-100 text-green-700">Default</span>}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{addr.name} • {addr.phone}</p>
                        <p className="text-sm text-gray-600">{addr.addressLine1}, {addr.city}, {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => { setUseNew(!useNew); setSelectedAddress(null) }}
                    className="text-sm text-primary-600 font-medium hover:text-primary-700">
                    + Add new address
                  </button>
                </div>
              )}

              {(useNew || addresses.length === 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {[['name','Full Name','col-span-1'],['phone','Phone','col-span-1'],['addressLine1','Address Line 1','col-span-2'],['addressLine2','Landmark (optional)','col-span-2'],['city','City','col-span-1'],['pincode','Pincode','col-span-1']].map(([field, label, span]) => (
                    <div key={field} className={span}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                      <input type="text" value={newAddress[field]} onChange={e => setNewAddress(p => ({ ...p, [field]: e.target.value }))}
                        className="input-field" placeholder={label} />
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => {
                const addr = useNew || addresses.length === 0 ? newAddress : addresses.find(a => a._id === selectedAddress) || addresses[0]
                if (!addr?.addressLine1) { toast.error('Please fill address details'); return }
                if (!selectedAddress && !useNew && addresses.length > 0) setSelectedAddress(addresses[0]._id)
                setStep(1)
              }} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-600" /> Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', emoji: '💵' },
                  { value: 'upi', label: 'UPI Payment', sub: 'GPay, PhonePe, Paytm', emoji: '📱' },
                  { value: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', emoji: '💳' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary-600" />
                    <span className="text-2xl">{opt.emoji}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Review Order <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Review Your Order</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => {
                  const p = item.productId
                  return (
                    <div key={p._id} className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity}{p.unit} × ₹{p.currentPrice}</p>
                      </div>
                      <span className="font-semibold text-sm">₹{Math.round(p.currentPrice * item.quantity)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{Math.round(cartMeta.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{cartMeta.deliveryFee === 0 ? 'FREE' : `₹${cartMeta.deliveryFee}`}</span></div>
                <div className="flex justify-between text-gray-600"><span>Taxes (5%)</span><span>₹{Math.round(cartMeta.taxes)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t"><span>Total</span><span>₹{Math.round(cartMeta.total)}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {placing ? <><Spinner size="sm" /> Placing...</> : `${t('place_order')} ₹${Math.round(cartMeta.total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mini summary sidebar */}
        <div className="hidden md:block">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId._id} className="flex items-center gap-2 text-sm">
                  <img src={item.productId.images?.[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="flex-1 text-gray-700 line-clamp-1">{item.productId.name}</span>
                  <span className="font-medium shrink-0">×{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-primary-700">₹{Math.round(cartMeta.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
