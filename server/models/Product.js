const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameTE: { type: String, trim: true },
  description: { type: String, trim: true },
  descriptionTE: String,
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'dairy', 'grains', 'leafy', 'organic', 'herbs', 'other'],
    required: true
  },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  images: [String],
  basePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, required: true, min: 0 },
  priceFloor: { type: Number },
  priceCeiling: { type: Number },
  unit: { type: String, default: 'kg', enum: ['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'bundle'] },
  stock: { type: Number, required: true, min: 0, default: 0 },
  minOrderQuantity: { type: Number, default: 0.25 },
  maxOrderQuantity: { type: Number, default: 10 },
  expiryDate: Date,
  harvestDate: Date,
  isOrganic: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  totalSold: { type: Number, default: 0 },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  tags: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
  },
  priceHistory: [{
    price: Number,
    reason: String,
    changedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ farmerId: 1 });
productSchema.index({ currentPrice: 1 });

module.exports = mongoose.model('Product', productSchema);
