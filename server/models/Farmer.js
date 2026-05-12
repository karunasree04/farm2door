const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  farmName: { type: String, required: true, trim: true },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number }
  },
  farmSize: String,
  crops: [String],
  certifications: [{ type: String, enum: ['organic', 'natural', 'conventional', 'gmp'] }],
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolder: String
  },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalSales: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  description: String,
  profileImage: String,
  establishedYear: Number,
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
