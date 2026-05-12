const mongoose = require('mongoose');

// ─── Cart ─────────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 0.25, default: 1 },
  priceAtAdd: Number,
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

// ─── Payment ──────────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['cod', 'upi', 'card', 'wallet', 'razorpay', 'stripe'] },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

// ─── Address ──────────────────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

// ─── DeliveryTracking ─────────────────────────────────────────────────────────
const deliveryTrackingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'],
    default: 'pending'
  },
  currentLocation: { lat: Number, lng: Number },
  locationHistory: [{ lat: Number, lng: Number, timestamp: Date }],
  estimatedArrival: Date,
  actualArrival: Date,
  distance: Number,
  route: mongoose.Schema.Types.Mixed,
  notes: String,
}, { timestamps: true });

const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingSchema);

// ─── PricingRule ──────────────────────────────────────────────────────────────
const pricingRuleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  category: String,
  ruleType: { type: String, enum: ['demand_surge', 'expiry_discount', 'seasonal', 'manual', 'anti_hoarding'] },
  condition: {
    demandThreshold: Number,
    supplyThreshold: Number,
    daysToExpiry: Number,
  },
  action: {
    adjustmentType: { type: String, enum: ['percentage', 'fixed'] },
    adjustmentValue: Number,
    maxPrice: Number,
    minPrice: Number,
  },
  isActive: { type: Boolean, default: true },
  appliedCount: { type: Number, default: 0 },
  lastApplied: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

// ─── DemandHistory ────────────────────────────────────────────────────────────
const demandHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  date: { type: Date, default: Date.now },
  quantitySold: { type: Number, default: 0 },
  quantityAvailable: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  cartAdds: { type: Number, default: 0 },
  demandScore: { type: Number, default: 0 },
  priceAtTime: Number,
  forecastedDemand: Number,
}, { timestamps: true });

const DemandHistory = mongoose.model('DemandHistory', demandHistorySchema);

// ─── AgentLog ─────────────────────────────────────────────────────────────────
const agentLogSchema = new mongoose.Schema({
  agentName: {
    type: String,
    enum: ['PricingAgent', 'DemandForecastAgent', 'LogisticsAgent', 'FarmerAdvisoryAgent', 'WasteReductionAgent', 'RecommendationAgent']
  },
  action: String,
  observation: mongoose.Schema.Types.Mixed,
  decision: String,
  result: mongoose.Schema.Types.Mixed,
  explanation: String,
  affectedEntities: [{ type: mongoose.Schema.Types.ObjectId }],
  success: { type: Boolean, default: true },
  executedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const AgentLog = mongoose.model('AgentLog', agentLogSchema);

// ─── Subscription ─────────────────────────────────────────────────────────────
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
  }],
  frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], default: 'weekly' },
  deliveryDay: Number,
  deliveryAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  isActive: { type: Boolean, default: true },
  nextDelivery: Date,
  totalDeliveries: { type: Number, default: 0 },
  paymentMethod: String,
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'delivery', 'price', 'general', 'promo'], default: 'general' },
  read: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Cart, Payment, Address, DeliveryTracking, PricingRule, DemandHistory, AgentLog, Subscription, Notification };
