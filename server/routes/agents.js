const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { AgentLog } = require('../models/index');
const agentRunner = require('../services/agentRunner');

router.get('/logs', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { agentName, page = 1, limit = 20 } = req.query;
    const query = agentName ? { agentName } : {};
    const logs = await AgentLog.find(query).sort({ executedAt: -1 }).skip((page-1)*limit).limit(Number(limit));
    const total = await AgentLog.countDocuments(query);
    res.json({ success: true, logs, total });
  } catch (e) { next(e); }
});

router.post('/run', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { agentType } = req.body;
    let result;
    if (agentType === 'pricing') result = await agentRunner.runPricingAgent();
    else if (agentType === 'demand_forecast') result = await agentRunner.runDemandAgent();
    else if (agentType === 'waste_reduction') result = await agentRunner.runWasteAgent();
    else if (agentType === 'logistics') result = await agentRunner.runLogisticsAgent();
    else if (agentType === 'recommendation') result = await agentRunner.runRecommendationAgent();
    else if (agentType === 'farmer_advisory') result = await agentRunner.runFarmerAdvisoryAgent();
    else result = await agentRunner.runAllAgents();
    res.json({ success: true, result, message: `${agentType} agent executed successfully` });
  } catch (e) { next(e); }
});

module.exports = router;
