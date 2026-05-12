// ─── Admin Controller ──────────────────────────────────────────────────────────
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Farmer = require('../models/Farmer');
const { AgentLog, DemandHistory, PricingRule, Notification } = require('../models/index');

exports.adminGetDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalFarmers] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Farmer.countDocuments()
    ]);

    const revenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'out_for_delivery'] } } },
      { $group: { _id: null, total: { $sum: '$total' }, avg: { $avg: '$total' } } }
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name email');
    const ordersByStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const salesByCategory = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', total: { $sum: '$items.subtotal' }, count: { $sum: 1 } } }
    ]);

    const last7Days = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalProducts, totalOrders, totalFarmers, revenue: revenue[0] || { total: 0, avg: 0 } },
      recentOrders, ordersByStatus, salesByCategory, last7Days
    });
  } catch (error) { next(error); }
};

exports.adminGetUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, total });
  } catch (error) { next(error); }
};

exports.adminToggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.adminUpdateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

exports.adminGetOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('customerId', 'name email phone')
        .populate('deliveryPartnerId', 'name phone'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total });
  } catch (error) { next(error); }
};

exports.adminGetAgentLogs = async (req, res, next) => {
  try {
    const logs = await AgentLog.find().sort({ executedAt: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (error) { next(error); }
};

exports.adminSetPricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, rule });
  } catch (error) { next(error); }
};

exports.adminBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, role } = req.body;
    const query = role ? { role } : {};
    const users = await User.find(query).select('_id');
    const notifications = users.map(u => ({ userId: u._id, title, message, type: type || 'general' }));
    await Notification.insertMany(notifications);
    res.json({ success: true, sent: notifications.length });
  } catch (error) { next(error); }
};

// ─── Farmer Controller ─────────────────────────────────────────────────────────
exports.getFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user._id }).populate('userId', 'name email phone avatar');
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    res.json({ success: true, farmer });
  } catch (error) { next(error); }
};

exports.updateFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOneAndUpdate({ userId: req.user._id }, req.body, { new: true, runValidators: true }).populate('userId', 'name email phone');
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    res.json({ success: true, farmer });
  } catch (error) { next(error); }
};

exports.getFarmerDashboard = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const products = await Product.find({ farmerId: farmer._id });
    const orders = await Order.find({ 'items.farmerId': farmer._id, status: { $ne: 'cancelled' } });

    const totalRevenue = orders.reduce((sum, order) => {
      const farmerItems = order.items.filter(i => i.farmerId.toString() === farmer._id.toString());
      return sum + farmerItems.reduce((s, i) => s + i.subtotal, 0);
    }, 0);

    const lowStock = products.filter(p => p.stock < 5);
    const recentOrders = await Order.find({ 'items.farmerId': farmer._id }).sort({ createdAt: -1 }).limit(5).populate('customerId', 'name');

    res.json({
      success: true,
      stats: { totalProducts: products.length, totalOrders: orders.length, totalRevenue: Math.round(totalRevenue), lowStockCount: lowStock.length },
      products, recentOrders, lowStockProducts: lowStock
    });
  } catch (error) { next(error); }
};

// ─── Delivery Controller ───────────────────────────────────────────────────────
exports.getDeliveryDashboard = async (req, res, next) => {
  try {
    const { DeliveryTracking } = require('../models/index');
    const delivered = await Order.countDocuments({ deliveryPartnerId: req.user._id, status: 'delivered' });
    const active = await Order.find({ deliveryPartnerId: req.user._id, status: 'out_for_delivery' }).populate('customerId', 'name phone').populate('items.productId', 'name');
    const available = await Order.find({ status: 'packed', deliveryPartnerId: null }).limit(10).populate('customerId', 'name phone');
    res.json({ success: true, stats: { delivered, active: active.length }, active, available });
  } catch (error) { next(error); }
};

exports.acceptDelivery = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.status !== 'packed') return res.status(400).json({ success: false, message: 'Order not available for pickup' });
    if (order.deliveryPartnerId) return res.status(400).json({ success: false, message: 'Already assigned' });

    order.deliveryPartnerId = req.user._id;
    order.status = 'assigned';
    order.statusHistory.push({ status: 'assigned', note: 'Assigned to delivery partner', updatedBy: req.user._id });
    await order.save();
    await DeliveryTracking.findOneAndUpdate({ orderId: order._id }, { deliveryPartnerId: req.user._id, status: 'assigned' });

    res.json({ success: true, order });
  } catch (error) { next(error); }
};

exports.updateDeliveryLocation = async (req, res, next) => {
  try {
    const { lat, lng, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || order.deliveryPartnerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const tracking = await DeliveryTracking.findOneAndUpdate(
      { orderId: order._id },
      { currentLocation: { lat, lng }, $push: { locationHistory: { lat, lng, timestamp: new Date() } }, ...(status && { status }) },
      { new: true }
    );

    if (status === 'out_for_delivery' && order.status !== 'out_for_delivery') {
      order.status = 'out_for_delivery';
      order.statusHistory.push({ status: 'out_for_delivery', note: 'Out for delivery', updatedBy: req.user._id });
      await order.save();
    }

    if (status === 'delivered') {
      order.status = 'delivered';
      order.actualDelivery = new Date();
      order.statusHistory.push({ status: 'delivered', note: 'Delivered successfully', updatedBy: req.user._id });
      await order.save();
      await Notification.create({ userId: order.customerId, title: 'Order Delivered!', message: `Your order #${order.orderId} has been delivered.`, type: 'delivery' });
    }

    res.json({ success: true, tracking });
  } catch (error) { next(error); }
};

// ─── Payment Controller ────────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;
    // Mock payment - simulate Razorpay order creation
    const mockOrderId = 'order_mock_' + Date.now();
    res.json({
      success: true,
      paymentOrder: {
        id: mockOrderId,
        amount: amount * 100,
        currency: 'INR',
        receipt: orderId,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
      }
    });
  } catch (error) { next(error); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const { Payment } = require('../models/index');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Mock verification - always succeeds for simulation
    order.paymentStatus = 'paid';
    order.paymentId = paymentId || 'pay_mock_' + Date.now();
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment confirmed', updatedBy: req.user._id });
    }
    await order.save();

    await Payment.create({ orderId: order._id, userId: req.user._id, amount: order.total, method: order.paymentMethod, status: 'success', gatewayPaymentId: paymentId });
    res.json({ success: true, message: 'Payment verified', order });
  } catch (error) { next(error); }
};

// ─── Address Controller ────────────────────────────────────────────────────────
exports.getAddresses = async (req, res, next) => {
  try {
    const { Address } = require('../models/index');
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) { next(error); }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { Address } = require('../models/index');
    if (req.body.isDefault) await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, address });
  } catch (error) { next(error); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { Address } = require('../models/index');
    if (req.body.isDefault) await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, address });
  } catch (error) { next(error); }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { Address } = require('../models/index');
    await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) { next(error); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) { next(error); }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};
