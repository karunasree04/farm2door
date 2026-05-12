const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');

// Customer routes
router.post('/', protect, orderController.createOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/my/:id', protect, orderController.getOrder);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Farmer routes
router.get('/farmer', protect, authorize('farmer'), orderController.getFarmerOrders);
router.put('/farmer/:id/status', protect, authorize('farmer'), orderController.updateFarmerOrderStatus);

// Delivery routes
router.get('/delivery', protect, authorize('delivery'), orderController.getDeliveryOrders);

// Admin / status update
router.put('/:id/status', protect, authorize('admin', 'delivery'), orderController.updateOrderStatus);

// Admin all orders
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('customerId', 'name email phone')
        .populate('deliveryPartnerId', 'name phone'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

module.exports = router;
