const Order = require('../models/Order');
const Product = require('../models/Product');
const { Cart, DeliveryTracking, Notification, DemandHistory } = require('../models/index');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, paymentMethod, specialInstructions } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'No items in order' });
    if (!deliveryAddress?.addressLine1) return res.status(400).json({ success: false, message: 'Delivery address required' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('farmerId');
      if (!product) return res.status(404).json({ success: false, message: `Product not found` });
      if (!product.isAvailable) return res.status(400).json({ success: false, message: `${product.name} is not available` });
      if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      if (item.quantity > product.maxOrderQuantity) return res.status(400).json({ success: false, message: `Max order for ${product.name} is ${product.maxOrderQuantity} ${product.unit}` });

      const itemSubtotal = Math.round(product.currentPrice * item.quantity * 100) / 100;
      subtotal += itemSubtotal;
      orderItems.push({
        productId: product._id,
        farmerId: product.farmerId._id,
        name: product.name,
        image: product.images?.[0] || '',
        quantity: item.quantity,
        unit: product.unit,
        priceAtOrder: product.currentPrice,
        subtotal: itemSubtotal
      });
    }

    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const taxes = Math.round(subtotal * 0.05);
    const total = Math.round(subtotal + deliveryFee + taxes);
    const farmerIds = [...new Set(orderItems.map(i => i.farmerId.toString()))];

    const order = await Order.create({
      customerId: req.user._id,
      items: orderItems,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      subtotal: Math.round(subtotal),
      deliveryFee,
      taxes,
      total,
      specialInstructions: specialInstructions || '',
      farmerStatuses: farmerIds.map(fId => ({ farmerId: fId, status: 'pending' })),
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedBy: req.user._id }],
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, totalSold: item.quantity } });
      await DemandHistory.findOneAndUpdate(
        { productId: item.productId, date: { $gte: new Date(new Date().setHours(0,0,0,0)) } },
        { $inc: { quantitySold: item.quantity }, productId: item.productId },
        { upsert: true }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    // Create tracking
    await DeliveryTracking.create({ orderId: order._id, status: 'pending' });
    // Notify
    await Notification.create({ userId: req.user._id, title: '✅ Order Placed!', message: `Your order #${order.orderId} has been placed. We'll notify you when it's confirmed.`, type: 'order', data: { orderId: order._id } });

    const populated = await Order.findById(order._id).populate('items.productId', 'name images unit');
    res.status(201).json({ success: true, order: populated });
  } catch (error) { next(error); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customerId: req.user._id };
    if (status) query.status = status;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('items.productId', 'name images unit'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total });
  } catch (error) { next(error); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name images unit category')
      .populate('deliveryPartnerId', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const customerId = order.customerId?._id?.toString() || order.customerId?.toString();
    const userId = req.user._id.toString();
    if (customerId !== userId && !['admin', 'delivery', 'farmer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const tracking = await DeliveryTracking.findOne({ orderId: order._id });
    res.json({ success: true, order, tracking });
  } catch (error) { next(error); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by customer', updatedBy: req.user._id });
    await order.save();
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity, totalSold: -item.quantity } });
    }
    await Notification.create({ userId: req.user._id, title: 'Order Cancelled', message: `Order #${order.orderId} cancelled.`, type: 'order' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || `Updated to ${status}`, updatedBy: req.user._id });
    if (status === 'delivered') { order.actualDelivery = new Date(); order.paymentStatus = 'paid'; }
    await order.save();
    await Notification.create({ userId: order.customerId, title: '📦 Order Update', message: `Your order #${order.orderId} is now: ${status.replace(/_/g,' ')}.`, type: 'order' });
    await DeliveryTracking.findOneAndUpdate({ orderId: order._id }, { status });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

exports.getFarmerOrders = async (req, res, next) => {
  try {
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) return res.status(403).json({ success: false, message: 'Farmer profile not found' });
    const orders = await Order.find({ 'items.farmerId': farmer._id })
      .sort({ createdAt: -1 })
      .populate('customerId', 'name phone')
      .populate('items.productId', 'name images');
    res.json({ success: true, orders });
  } catch (error) { next(error); }
};

exports.updateFarmerOrderStatus = async (req, res, next) => {
  try {
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) return res.status(403).json({ success: false, message: 'Farmer not found' });
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const fs = order.farmerStatuses.find(f => f.farmerId?.toString() === farmer._id.toString());
    if (fs) fs.status = status;
    const allAccepted = order.farmerStatuses.every(f => f.status === 'accepted');
    const allPacked = order.farmerStatuses.every(f => f.status === 'packed');
    if (allAccepted && order.status === 'pending') order.status = 'confirmed';
    if (allPacked) order.status = 'packed';
    order.statusHistory.push({ status: order.status, note: `Farmer updated to ${status}`, updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

exports.getDeliveryOrders = async (req, res, next) => {
  try {
    const available = await Order.find({ status: 'packed', deliveryPartnerId: null })
      .populate('customerId', 'name phone').populate('items.productId', 'name');
    const mine = await Order.find({ deliveryPartnerId: req.user._id, status: { $in: ['assigned','out_for_delivery'] } })
      .populate('customerId', 'name phone');
    res.json({ success: true, available, mine });
  } catch (error) { next(error); }
};
