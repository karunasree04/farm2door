const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');
const ctrl = require('../controllers/productController');

router.get('/', optionalAuth, ctrl.getProducts);
router.get('/featured', ctrl.getFeatured);
router.get('/bestsellers', ctrl.getBestsellers);
router.get('/trending', ctrl.getTrending);
router.get('/categories', ctrl.getCategories);
router.get('/recommended', optionalAuth, ctrl.getRecommended);
router.get('/:id', ctrl.getProduct);
router.get('/:id/related', ctrl.getRelated);
router.post('/', protect, authorize('farmer', 'admin'), productValidation, ctrl.createProduct);
router.put('/:id', protect, authorize('farmer', 'admin'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('farmer', 'admin'), ctrl.deleteProduct);

module.exports = router;
