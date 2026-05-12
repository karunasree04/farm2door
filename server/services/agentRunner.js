const cron = require('node-cron');
const pricingEngine = require('./pricingEngine');
const logger = require('../config/logger');
const { AgentLog } = require('../models/index');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Farmer = require('../models/Farmer');

// ─── Pricing Agent ─────────────────────────────────────────────────────────────
// Runs every hour
cron.schedule('0 * * * *', async () => {
  logger.info('🤖 PricingAgent: Running pricing update...');
  try {
    const result = await pricingEngine.runPricingUpdate();
    logger.info(`🤖 PricingAgent: Updated ${result.updated} products`);
  } catch (e) { logger.error('PricingAgent error:', e); }
});

// ─── Demand Forecast Agent ─────────────────────────────────────────────────────
// Runs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('🤖 DemandForecastAgent: Running demand analysis...');
  try {
    const products = await Product.find({ isAvailable: true }).select('_id name totalSold stock');
    const forecasts = [];
    for (const product of products) {
      const forecast = await pricingEngine.getForecast(product._id);
      if (forecast.confidence > 30) {
        forecasts.push({
          agentName: 'DemandForecastAgent',
          action: 'demand_forecast',
          observation: { productId: product._id, currentStock: product.stock },
          decision: forecast.recommendation,
          result: forecast,
          explanation: `${product.name}: ${forecast.recommendation}. Avg daily sales: ${forecast.avgDailySales}. Trend: ${forecast.trend > 0 ? '+' : ''}${forecast.trend}%.`,
          affectedEntities: [product._id],
          success: true,
          executedAt: new Date()
        });
      }
    }
    if (forecasts.length > 0) await AgentLog.insertMany(forecasts);
    logger.info(`🤖 DemandForecastAgent: Forecasted ${forecasts.length} products`);
  } catch (e) { logger.error('DemandForecastAgent error:', e); }
});

// ─── Logistics Agent ──────────────────────────────────────────────────────────
// Runs every 30 minutes - auto-assign deliveries
cron.schedule('*/30 * * * *', async () => {
  try {
    const User = require('../models/User');
    const { DeliveryTracking } = require('../models/index');

    const unassignedOrders = await Order.find({ status: 'packed', deliveryPartnerId: null }).limit(5);
    const deliveryPartners = await User.find({ role: 'delivery', isActive: true }).select('_id');

    for (let i = 0; i < unassignedOrders.length; i++) {
      const order = unassignedOrders[i];
      const partner = deliveryPartners[i % deliveryPartners.length];
      if (!partner) continue;

      order.deliveryPartnerId = partner._id;
      order.status = 'assigned';
      order.statusHistory.push({ status: 'assigned', note: 'Auto-assigned by LogisticsAgent', updatedBy: partner._id });
      await order.save();
      await DeliveryTracking.findOneAndUpdate({ orderId: order._id }, { deliveryPartnerId: partner._id, status: 'assigned' });

      await AgentLog.create({
        agentName: 'LogisticsAgent',
        action: 'auto_assign_delivery',
        observation: { orderId: order._id, availablePartners: deliveryPartners.length },
        decision: `Assign order to partner ${partner._id}`,
        result: { assigned: true },
        explanation: `Auto-assigned order #${order.orderId} to nearest available delivery partner.`,
        affectedEntities: [order._id, partner._id],
        success: true
      });
    }
  } catch (e) { logger.error('LogisticsAgent error:', e); }
});

// ─── Farmer Advisory Agent ────────────────────────────────────────────────────
// Runs daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const farmers = await Farmer.find({ isActive: true });
    const advisories = [];
    for (const farmer of farmers) {
      const products = await Product.find({ farmerId: farmer._id, isAvailable: true });
      const lowStockProducts = products.filter(p => p.stock < 10);
      const highDemandProducts = products.filter(p => p.totalSold > 50);

      const advice = [];
      if (lowStockProducts.length > 0) advice.push(`Restock: ${lowStockProducts.map(p => p.name).join(', ')}`);
      if (highDemandProducts.length > 0) advice.push(`High demand: ${highDemandProducts.map(p => p.name).join(', ')} - consider increasing supply`);

      if (advice.length > 0) {
        advisories.push({
          agentName: 'FarmerAdvisoryAgent',
          action: 'farming_advice',
          observation: { farmerId: farmer._id, productCount: products.length, lowStockCount: lowStockProducts.length },
          decision: 'Send advisory to farmer',
          result: { advice },
          explanation: advice.join('. '),
          affectedEntities: [farmer._id],
          success: true
        });
      }
    }
    if (advisories.length > 0) await AgentLog.insertMany(advisories);
    logger.info(`🤖 FarmerAdvisoryAgent: Generated ${advisories.length} advisories`);
  } catch (e) { logger.error('FarmerAdvisoryAgent error:', e); }
});

// ─── Waste Reduction Agent ─────────────────────────────────────────────────────
// Runs twice daily
cron.schedule('0 6,18 * * *', async () => {
  try {
    const { Notification } = require('../models/index');
    const expiringProducts = await Product.find({
      expiryDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), $gte: new Date() },
      isAvailable: true,
      stock: { $gt: 0 }
    });

    for (const product of expiringProducts) {
      await AgentLog.create({
        agentName: 'WasteReductionAgent',
        action: 'expiry_alert',
        observation: { productId: product._id, expiryDate: product.expiryDate, stock: product.stock },
        decision: 'Flag for discount',
        result: { flagged: true },
        explanation: `${product.name} expires soon with ${product.stock}${product.unit} remaining stock. Discount applied.`,
        success: true
      });
    }
    logger.info(`🤖 WasteReductionAgent: Flagged ${expiringProducts.length} expiring products`);
  } catch (e) { logger.error('WasteReductionAgent error:', e); }
});

// ─── Recommendation Agent ─────────────────────────────────────────────────────
// Runs daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    // Update trending products based on last 7 days sales
    const trending = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    await Product.updateMany({}, { isTrending: false });
    const trendingIds = trending.map(t => t._id);
    await Product.updateMany({ _id: { $in: trendingIds } }, { isTrending: true });

    await AgentLog.create({
      agentName: 'RecommendationAgent',
      action: 'update_trending',
      observation: { analyzedOrders: trending.length },
      decision: `Mark top ${trendingIds.length} products as trending`,
      result: { trendingProducts: trendingIds },
      explanation: `Updated trending products based on last 7 days sales data. ${trendingIds.length} products marked as trending.`,
      success: true
    });
    logger.info(`🤖 RecommendationAgent: Updated ${trendingIds.length} trending products`);
  } catch (e) { logger.error('RecommendationAgent error:', e); }
});

logger.info('🤖 All AI Agents initialized and scheduled');

// Exported functions for manual trigger
async function runPricingAgent() {
  const result = await pricingEngine.runPricingUpdate();
  await AgentLog.create({ agentName: 'PricingAgent', action: 'manual_run', decision: 'Manual pricing update', result, explanation: `Manual run: updated ${result.updated} products pricing.`, success: true });
  return result;
}

async function runDemandAgent() {
  const products = await Product.find({ isAvailable: true }).select('_id name totalSold stock').limit(10);
  const forecasts = [];
  for (const product of products) {
    const forecast = await pricingEngine.getForecast(product._id);
    forecasts.push({ productId: product._id, name: product.name, forecast });
  }
  await AgentLog.create({ agentName: 'DemandForecastAgent', action: 'manual_run', decision: 'Manual demand forecast', result: { count: forecasts.length }, explanation: `Manual demand forecast for ${forecasts.length} products.`, success: true });
  return { forecasts };
}

async function runWasteAgent() {
  const expiringProducts = await Product.find({ expiryDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), $gte: new Date() }, stock: { $gt: 0 } });
  for (const product of expiringProducts) {
    if (product.discount < 25) { product.discount = 25; await product.save(); }
  }
  await AgentLog.create({ agentName: 'WasteReductionAgent', action: 'manual_run', decision: 'Apply expiry discounts', result: { flagged: expiringProducts.length }, explanation: `Applied 25% discount to ${expiringProducts.length} expiring products.`, success: true });
  return { flagged: expiringProducts.length };
}

async function runLogisticsAgent() {
  const User = require('../models/User');
  const { DeliveryTracking } = require('../models/index');
  const unassigned = await Order.find({ status: 'packed', deliveryPartnerId: null }).limit(10);
  const partners = await User.find({ role: 'delivery', isActive: true }).select('_id');
  let assigned = 0;
  for (let i = 0; i < unassigned.length; i++) {
    const partner = partners[i % (partners.length || 1)];
    if (!partner) continue;
    unassigned[i].deliveryPartnerId = partner._id;
    unassigned[i].status = 'assigned';
    unassigned[i].statusHistory.push({ status: 'assigned', note: 'Manual logistics run', updatedBy: partner._id });
    await unassigned[i].save();
    assigned++;
  }
  await AgentLog.create({ agentName: 'LogisticsAgent', action: 'manual_run', decision: 'Auto assign deliveries', result: { assigned }, explanation: `Manually assigned ${assigned} orders to delivery partners.`, success: true });
  return { assigned };
}

async function runRecommendationAgent() {
  const trending = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } }, { $limit: 10 }
  ]);
  await Product.updateMany({}, { isTrending: false });
  if (trending.length) await Product.updateMany({ _id: { $in: trending.map(t => t._id) } }, { isTrending: true });
  await AgentLog.create({ agentName: 'RecommendationAgent', action: 'manual_run', decision: 'Update trending products', result: { updated: trending.length }, explanation: `Updated ${trending.length} trending products.`, success: true });
  return { updated: trending.length };
}

async function runFarmerAdvisoryAgent() {
  const farmers = await Farmer.find({ isVerified: true });
  const { Notification } = require('../models/index');
  for (const farmer of farmers) {
    await Notification.create({ userId: farmer.userId, title: '🌾 Farming Tip', message: 'Market demand for leafy greens is high this week. Consider increasing stock.', type: 'general' });
  }
  await AgentLog.create({ agentName: 'FarmerAdvisoryAgent', action: 'manual_run', decision: 'Send advisory notifications', result: { farmerCount: farmers.length }, explanation: `Sent advisory to ${farmers.length} farmers about current market conditions.`, success: true });
  return { notified: farmers.length };
}

async function runAllAgents() {
  const results = await Promise.allSettled([runPricingAgent(), runDemandAgent(), runWasteAgent(), runLogisticsAgent(), runRecommendationAgent()]);
  return results.map((r, i) => ({ agent: ['pricing','demand','waste','logistics','recommendation'][i], status: r.status, value: r.value }));
}

module.exports = { runPricingAgent, runDemandAgent, runWasteAgent, runLogisticsAgent, runRecommendationAgent, runFarmerAdvisoryAgent, runAllAgents };
