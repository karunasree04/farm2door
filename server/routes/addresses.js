const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.get('/', protect, ctrl.getAddresses);
router.post('/', protect, ctrl.addAddress);
router.put('/:id', protect, ctrl.updateAddress);
router.delete('/:id', protect, ctrl.deleteAddress);

module.exports = router;
