import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { LangProvider } from './contexts/LangContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import { OrdersPage, OrderDetailPage } from './pages/OrdersPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { FarmersPage, FarmerProfilePage } from './pages/FarmersPage'
import FarmerDashboard from './pages/FarmerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DeliveryDashboard from './pages/DeliveryDashboard'
import ProfilePage from './pages/ProfilePage'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
              <Route path="/farmers" element={<Layout><FarmersPage /></Layout>} />
              <Route path="/farmers/:id" element={<Layout><FarmerProfilePage /></Layout>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Auth required */}
              <Route path="/cart" element={<ProtectedRoute><Layout><CartPage /></Layout></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Layout><CheckoutPage /></Layout></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetailPage /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

              {/* Role dashboards */}
              <Route path="/farmer" element={
                <ProtectedRoute roles={['farmer']}>
                  <DashboardLayout><FarmerDashboard /></DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <DashboardLayout><AdminDashboard /></DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/delivery" element={
                <ProtectedRoute roles={['delivery']}>
                  <DashboardLayout><DeliveryDashboard /></DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={
                <Layout>
                  <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <div className="text-8xl mb-6">🌿</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                    <p className="text-gray-500 mb-6">Looks like this page got lost in the fields.</p>
                    <a href="/" className="btn-primary">Go Home</a>
                  </div>
                </Layout>
              } />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
