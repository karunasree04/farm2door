const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const Farmer = require('../models/Farmer');

router.get('/profile', protect, authorize('farmer'), ctrl.getFarmerProfile);
router.put('/profile', protect, authorize('farmer'), ctrl.updateFarmerProfile);
router.get('/dashboard', protect, authorize('farmer'), ctrl.getFarmerDashboard);
router.get('/', async (req, res, next) => {
  try {
    const farmers = await Farmer.find({ isActive: true, isVerified: true }).populate('userId', 'name avatar').select('-bankDetails');
    res.json({ success: true, farmers });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('userId', 'name avatar email');
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });
    res.json({ success: true, farmer });
  } catch (e) { next(e); }
});

module.exports = router;
