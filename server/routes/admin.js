const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/dashboard', ctrl.adminGetDashboard);
router.get('/users', ctrl.adminGetUsers);
router.put('/users/:id/toggle', ctrl.adminToggleUser);
router.get('/orders', ctrl.adminGetOrders);
router.put('/products/:id', ctrl.adminUpdateProduct);
router.get('/agent-logs', ctrl.adminGetAgentLogs);
router.post('/pricing-rules', ctrl.adminSetPricingRule);
router.post('/notifications/broadcast', ctrl.adminBroadcastNotification);

module.exports = router;
