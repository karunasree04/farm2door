const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  name: String,
  image: String,
  quantity: { type: Number, required: true, min: 0.25 },
  unit: String,
  priceAtOrder: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, default: () => 'F2D-' + uuidv4().split('-')[0].toUpperCase(), unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  deliveryAddress: {
    name: String, phone: String, addressLine1: String,
    addressLine2: String, city: String, state: String,
    pincode: String, coordinates: { lat: Number, lng: Number }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  paymentMethod: { type: String, enum: ['cod', 'upi', 'card', 'wallet', 'razorpay', 'stripe'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: String,
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  total: { type: Number, required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimatedDelivery: Date,
  actualDelivery: Date,
  specialInstructions: String,
  isSubscription: { type: Boolean, default: false },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  isPreOrder: { type: Boolean, default: false },
  preOrderDate: Date,
  farmerStatuses: [{
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'packed'], default: 'pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
