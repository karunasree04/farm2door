const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const { DemandHistory } = require('../models/index');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort, minPrice, maxPrice, isOrganic, page = 1, limit = 20, farmerId } = req.query;
    const query = { isAvailable: true };

    if (category && category !== 'all') query.category = category;
    if (isOrganic === 'true') query.isOrganic = true;
    if (farmerId) query.farmerId = farmerId;
    if (minPrice || maxPrice) {
      query.currentPrice = {};
      if (minPrice) query.currentPrice.$gte = Number(minPrice);
      if (maxPrice) query.currentPrice.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const sortMap = {
      'price_asc': { currentPrice: 1 },
      'price_desc': { currentPrice: -1 },
      'newest': { createdAt: -1 },
      'bestseller': { totalSold: -1 },
      'rating': { rating: -1 },
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(Number(limit)).populate('farmerId', 'farmName location rating'),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmerId', 'farmName location rating certifications userId');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Track view
    await DemandHistory.findOneAndUpdate(
      { productId: product._id, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      { $inc: { viewCount: 1 }, productId: product._id },
      { upsert: true, new: true }
    );

    res.json({ success: true, product });
  } catch (error) { next(error); }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const featured = await Product.find({ isFeatured: true, isAvailable: true }).limit(8).populate('farmerId', 'farmName');
    res.json({ success: true, products: featured });
  } catch (error) { next(error); }
};

exports.getBestsellers = async (req, res, next) => {
  try {
    const bestsellers = await Product.find({ isAvailable: true }).sort({ totalSold: -1 }).limit(10).populate('farmerId', 'farmName');
    res.json({ success: true, products: bestsellers });
  } catch (error) { next(error); }
};

exports.getTrending = async (req, res, next) => {
  try {
    const trending = await Product.find({ isTrending: true, isAvailable: true }).limit(8).populate('farmerId', 'farmName');
    res.json({ success: true, products: trending });
  } catch (error) { next(error); }
};

exports.getRelated = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await Product.find({
      category: product.category, _id: { $ne: product._id }, isAvailable: true
    }).limit(6).populate('farmerId', 'farmName');
    res.json({ success: true, products: related });
  } catch (error) { next(error); }
};

exports.getRecommended = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    let products = [];

    if (req.user) {
      const pastOrders = await Order.find({ customerId: req.user._id }).limit(10);
      const boughtCategories = [...new Set(pastOrders.flatMap(o => o.items.map(i => i.productId)))];
      if (boughtCategories.length > 0) {
        const boughtProducts = await Product.find({ _id: { $in: boughtCategories } }).select('category');
        const cats = [...new Set(boughtProducts.map(p => p.category))];
        products = await Product.find({ category: { $in: cats }, isAvailable: true }).sort({ rating: -1 }).limit(8).populate('farmerId', 'farmName');
      }
    }

    if (products.length < 8) {
      const extra = await Product.find({ isAvailable: true }).sort({ rating: -1, totalSold: -1 }).limit(8 - products.length).populate('farmerId', 'farmName');
      products = [...products, ...extra];
    }

    res.json({ success: true, products });
  } catch (error) { next(error); }
};

// Farmer-only
exports.createProduct = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) return res.status(403).json({ success: false, message: 'Farmer profile not found' });

    const productData = { ...req.body, farmerId: farmer._id, currentPrice: req.body.basePrice, priceFloor: req.body.basePrice, priceCeiling: req.body.basePrice * 2 };
    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user._id });
    const product = await Product.findOne({ _id: req.params.id, farmerId: farmer?._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updates = req.body;
    if (updates.basePrice && updates.basePrice !== product.basePrice) {
      product.priceHistory.push({ price: product.currentPrice, reason: 'Manual update', changedAt: new Date() });
    }
    Object.assign(product, updates);
    await product.save();
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user._id });
    const product = await Product.findOneAndDelete({ _id: req.params.id, farmerId: farmer?._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$currentPrice' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, categories });
  } catch (error) { next(error); }
};
