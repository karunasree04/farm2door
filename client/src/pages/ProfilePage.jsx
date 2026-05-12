import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, MapPin, Plus, Edit, Trash2, Heart, Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t } = useLang()
  const qc = useQueryClient()
  const [tab, setTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [addrForm, setAddrForm] = useState({ label:'home', name:'', phone:'', addressLine1:'', city:'', state:'Telangana', pincode:'', isDefault: false })
  const [showAddrForm, setShowAddrForm] = useState(false)

  const { data: addrData, refetch: refetchAddrs } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data),
    enabled: tab === 'addresses'
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: tab === 'notifications'
  })

  const saveProfile = async () => {
    try {
      await api.put('/auth/me', form)
      await refreshUser()
      setEditMode(false)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
  }

  const saveAddress = async () => {
    if (!addrForm.name || !addrForm.addressLine1 || !addrForm.city || !addrForm.pincode) {
      toast.error('Please fill all required fields'); return
    }
    try {
      await api.post('/addresses', addrForm)
      setShowAddrForm(false)
      setAddrForm({ label:'home', name:'', phone:'', addressLine1:'', city:'', state:'Telangana', pincode:'', isDefault:false })
      refetchAddrs()
      toast.success('Address saved!')
    } catch { toast.error('Failed to save address') }
  }

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`)
      refetchAddrs()
      toast.success('Address removed')
    } catch { toast.error('Failed to remove') }
  }

  const markNotifRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); qc.invalidateQueries(['notifications']) } catch {}
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
            <t.icon className="w-4 h-4" /><span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 text-2xl font-bold">{user?.name?.[0]}</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
              <span className={`badge capitalize ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : user?.role === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{user?.role}</span>
            </div>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveProfile} className="btn-primary flex-1">Save Changes</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: User, label: 'Full Name', value: user?.name },
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => setEditMode(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {tab === 'addresses' && (
        <div className="space-y-3">
          {addrData?.addresses?.map(addr => (
            <div key={addr._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm capitalize text-gray-900">{addr.label}</span>
                    {addr.isDefault && <span className="badge bg-green-100 text-green-700">Default</span>}
                  </div>
                  <p className="text-sm text-gray-700">{addr.name} • {addr.phone}</p>
                  <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
                <button onClick={() => deleteAddress(addr._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {showAddrForm ? (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Add New Address</h3>
              <div className="grid grid-cols-2 gap-3">
                {[['name','Name'],['phone','Phone'],['addressLine1','Address Line 1'],['city','City'],['pincode','Pincode']].map(([field, label]) => (
                  <div key={field} className={field === 'addressLine1' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input className="input-field" placeholder={label} value={addrForm[field]}
                      onChange={e => setAddrForm(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                  <select className="input-field" value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))}>
                    {['home','work','other'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm(p => ({ ...p, isDefault: e.target.checked }))} className="accent-primary-600" />
                Set as default address
              </label>
              <div className="flex gap-3">
                <button onClick={() => setShowAddrForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveAddress} className="btn-primary flex-1">Save Address</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddrForm(true)} className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifData?.notifications?.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : notifData?.notifications?.map(notif => (
            <div key={notif._id} onClick={() => markNotifRead(notif._id)}
              className={`card p-4 cursor-pointer ${!notif.read ? 'border-l-4 border-primary-500 bg-primary-50/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString('en-IN')}</p>
                </div>
                {!notif.read && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full shrink-0 mt-1" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
