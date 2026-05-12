const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const pricingEngine = require('../services/pricingEngine');
const { PricingRule } = require('../models/index');

router.get('/rules', protect, authorize('admin'), async (req, res, next) => {
  try {
    const rules = await PricingRule.find().sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (e) { next(e); }
});
router.post('/run', protect, authorize('admin'), async (req, res, next) => {
  try {
    const result = await pricingEngine.runPricingUpdate();
    res.json({ success: true, result });
  } catch (e) { next(e); }
});
router.get('/forecast/:productId', protect, authorize('admin', 'farmer'), async (req, res, next) => {
  try {
    const forecast = await pricingEngine.getForecast(req.params.productId);
    res.json({ success: true, forecast });
  } catch (e) { next(e); }
});

module.exports = router;
