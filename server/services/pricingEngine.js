const Product = require('../models/Product');
const { DemandHistory, PricingRule, AgentLog } = require('../models/index');

class PricingEngine {
  async runPricingUpdate() {
    const logs = [];
    try {
      const products = await Product.find({ isAvailable: true });

      for (const product of products) {
        const demand = await this.getDemandScore(product._id);
        const newPrice = await this.calculateOptimalPrice(product, demand);

        if (Math.abs(newPrice - product.currentPrice) > 0.5) {
          const oldPrice = product.currentPrice;
          product.priceHistory.push({ price: oldPrice, reason: `Auto-adjustment: demand=${demand.score}`, changedAt: new Date() });
          product.currentPrice = Math.round(newPrice * 100) / 100;
          await product.save();

          logs.push({
            agentName: 'PricingAgent',
            action: 'price_adjustment',
            observation: { productId: product._id, demandScore: demand.score, oldPrice },
            decision: `Adjust price from ₹${oldPrice} to ₹${newPrice}`,
            result: { newPrice },
            explanation: this.getExplanation(product, demand, oldPrice, newPrice),
            affectedEntities: [product._id],
            success: true,
            executedAt: new Date()
          });
        }

        // Check expiry discounts
        if (product.expiryDate) {
          const daysToExpiry = Math.floor((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 3 && daysToExpiry > 0) {
            const discountPercent = daysToExpiry <= 1 ? 40 : daysToExpiry <= 2 ? 25 : 15;
            const discountedPrice = Math.max(product.basePrice * 0.6, product.currentPrice * (1 - discountPercent / 100));
            if (discountedPrice < product.currentPrice) {
              product.currentPrice = Math.round(discountedPrice * 100) / 100;
              product.discount = discountPercent;
              await product.save();
              logs.push({
                agentName: 'WasteReductionAgent',
                action: 'expiry_discount',
                observation: { productId: product._id, daysToExpiry },
                decision: `Apply ${discountPercent}% expiry discount`,
                result: { newPrice: product.currentPrice },
                explanation: `${product.name} expires in ${daysToExpiry} day(s). Applied ${discountPercent}% discount to reduce waste.`,
                success: true,
                executedAt: new Date()
              });
            }
          }
        }
      }

      if (logs.length > 0) await AgentLog.insertMany(logs);
      return { updated: logs.length, logs };
    } catch (error) {
      console.error('Pricing engine error:', error);
      return { updated: 0, error: error.message };
    }
  }

  async getDemandScore(productId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const history = await DemandHistory.find({ productId, date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

    if (!history.length) return { score: 50, sold: 0, views: 0 };

    const totalSold = history.reduce((s, h) => s + h.quantitySold, 0);
    const totalViews = history.reduce((s, h) => s + h.viewCount, 0);
    const totalCartAdds = history.reduce((s, h) => s + h.cartAdds, 0);

    const score = Math.min(100, (totalSold * 10) + (totalViews * 0.5) + (totalCartAdds * 3));
    return { score, sold: totalSold, views: totalViews, cartAdds: totalCartAdds };
  }

  async calculateOptimalPrice(product, demand) {
    const floor = product.priceFloor || product.basePrice;
    const ceiling = product.priceCeiling || product.basePrice * 2.5;
    let price = product.currentPrice;

    // Demand-supply logic
    const stockRatio = product.stock > 0 ? Math.min(100, (100 / product.stock) * 10) : 100;

    if (demand.score > 70 && stockRatio > 60) {
      // High demand, low supply → increase price
      const surge = Math.min(0.25, (demand.score - 70) / 100);
      price = product.currentPrice * (1 + surge);
    } else if (demand.score < 30 && stockRatio < 30) {
      // Low demand, high supply → decrease price
      const drop = Math.min(0.20, (30 - demand.score) / 100);
      price = product.currentPrice * (1 - drop);
    } else if (demand.score > 50) {
      // Moderate demand increase
      price = product.currentPrice * 1.05;
    } else if (demand.score < 20) {
      // Very low demand, nudge down
      price = product.currentPrice * 0.97;
    }

    return Math.max(floor, Math.min(ceiling, price));
  }

  getExplanation(product, demand, oldPrice, newPrice) {
    if (newPrice > oldPrice) {
      return `High demand (score: ${demand.score}) with limited stock for "${product.name}". Price increased from ₹${oldPrice} to ₹${newPrice} to balance supply-demand.`;
    } else {
      return `Low demand (score: ${demand.score}) for "${product.name}". Price reduced from ₹${oldPrice} to ₹${newPrice} to stimulate sales.`;
    }
  }

  async getForecast(productId) {
    const history = await DemandHistory.find({ productId }).sort({ date: -1 }).limit(14);
    if (history.length < 3) return { forecast: 'Insufficient data', confidence: 0 };

    const avgSold = history.slice(0, 7).reduce((s, h) => s + h.quantitySold, 0) / 7;
    const prevAvg = history.slice(7, 14).reduce((s, h) => s + h.quantitySold, 0) / 7;
    const trend = prevAvg > 0 ? ((avgSold - prevAvg) / prevAvg) * 100 : 0;

    return {
      avgDailySales: Math.round(avgSold * 100) / 100,
      trend: Math.round(trend),
      forecastedWeekly: Math.round(avgSold * 7 * (1 + trend / 100)),
      recommendation: trend > 10 ? 'Increase stock' : trend < -10 ? 'Consider discount' : 'Maintain current stock',
      confidence: Math.min(95, history.length * 5)
    };
  }
}

module.exports = new PricingEngine();
