const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const Order = require('../models/Order');
const { DeliveryTracking } = require('../models/index');

router.get('/dashboard', protect, authorize('delivery'), ctrl.getDeliveryDashboard);
router.put('/orders/:id/accept', protect, authorize('delivery'), ctrl.acceptDelivery);
router.put('/orders/:id/location', protect, authorize('delivery'), ctrl.updateDeliveryLocation);

// Get delivery orders filtered by status
router.get('/orders', protect, authorize('delivery', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { deliveryPartnerId: req.user._id };
    if (status === 'active') query.status = { $in: ['assigned', 'out_for_delivery'] };
    else if (status === 'delivered') query.status = 'delivered';
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50);

    const today = new Date(); today.setHours(0,0,0,0);
    const todayCount = await Order.countDocuments({ deliveryPartnerId: req.user._id, createdAt: { $gte: today } });
    const pendingCount = await Order.countDocuments({ deliveryPartnerId: req.user._id, status: { $in: ['assigned','out_for_delivery'] } });
    const deliveredCount = await Order.countDocuments({ deliveryPartnerId: req.user._id, status: 'delivered' });

    res.json({ success: true, orders, todayCount, pendingCount, deliveredCount });
  } catch (e) { next(e); }
});

// Update delivery location
router.put('/location/:orderId', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await DeliveryTracking.findOneAndUpdate(
      { orderId: req.params.orderId },
      { currentLocation: { lat, lng }, $push: { locationHistory: { lat, lng, timestamp: new Date() } } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Location updated' });
  } catch (e) { next(e); }
});

module.exports = router;
