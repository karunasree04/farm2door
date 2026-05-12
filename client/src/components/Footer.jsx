import { Leaf, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Farm2Door</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Fresh produce from local Telangana farmers delivered directly to your doorstep. Supporting farmers, feeding families.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/',  'Home'],['/products','Products'],['/farmers','Our Farmers'],['/about','About Us']].map(([to,label]) => (
                <li key={to}><Link to={to} className="hover:text-primary-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {['Vegetables','Fruits','Dairy','Leafy Greens','Organic','Grains'].map(cat => (
                <li key={cat}><Link to={`/products?category=${cat.toLowerCase().replace(' ','_')}`} className="hover:text-primary-400 transition-colors">{cat}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary-400" /><span>+91 90000 00000</span></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary-400" /><span>support@farm2door.com</span></li>
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary-400 mt-0.5" /><span>Hyderabad, Telangana, India</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2024 Farm2Door. All rights reserved. Made with 🌱 in Hyderabad</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-primary-400">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-400">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
