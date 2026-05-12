const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.post('/create-order', protect, ctrl.createPaymentOrder);
router.post('/verify', protect, ctrl.verifyPayment);

module.exports = router;
