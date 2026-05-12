const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/cartController');

router.get('/', protect, ctrl.getCart);
router.post('/add', protect, ctrl.addToCart);
router.put('/update', protect, ctrl.updateCartItem);
router.delete('/clear', protect, ctrl.clearCart);
router.delete('/:productId', protect, ctrl.removeFromCart);

module.exports = router;
