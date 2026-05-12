const { Cart } = require('../models/index');
const Product = require('../models/Product');

// Safe upsert helper - handles race conditions and duplicate key errors
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    try {
      cart = await Cart.create({ userId, items: [] });
    } catch (err) {
      // Duplicate key - another request created it, fetch it
      if (err.code === 11000) {
        cart = await Cart.findOne({ userId });
      } else {
        throw err;
      }
    }
  }
  return cart;
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: 'items.productId',
      select: 'name images currentPrice basePrice stock unit isAvailable farmerId maxOrderQuantity minOrderQuantity discount',
      populate: { path: 'farmerId', select: 'farmName' }
    });

    if (!cart) cart = await getOrCreateCart(req.user._id);

    // Remove items where product was deleted or unavailable
    const validItems = (cart.items || []).filter(
      item => item.productId && item.productId.isAvailable
    );
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const subtotal = validItems.reduce((sum, item) => {
      const price = item.productId?.currentPrice || 0;
      return sum + price * item.quantity;
    }, 0);

    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + taxes;

    res.json({
      success: true,
      cart,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      taxes,
      total: Math.round(total * 100) / 100
    });
  } catch (error) { next(error); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }

    const requestedQty = Number(quantity) || product.minOrderQuantity || 1;

    if (requestedQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} ${product.unit} in stock` });
    }
    if (requestedQty > product.maxOrderQuantity) {
      return res.status(400).json({ success: false, message: `Max order quantity is ${product.maxOrderQuantity} ${product.unit}` });
    }

    const cart = await getOrCreateCart(req.user._id);

    const existingIdx = cart.items.findIndex(
      i => i.productId.toString() === productId.toString()
    );

    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + requestedQty;
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} ${product.unit} available` });
      }
      if (newQty > product.maxOrderQuantity) {
        return res.status(400).json({ success: false, message: `Max order is ${product.maxOrderQuantity} ${product.unit}` });
      }
      cart.items[existingIdx].quantity = newQty;
      cart.items[existingIdx].priceAtAdd = product.currentPrice;
    } else {
      cart.items.push({ productId, quantity: requestedQty, priceAtAdd: product.currentPrice });
    }

    await cart.save();
    res.json({ success: true, message: 'Added to cart', itemCount: cart.items.length });
  } catch (error) { next(error); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const cart = await getOrCreateCart(req.user._id);
    const qty = Number(quantity);

    if (qty <= 0) {
      cart.items = cart.items.filter(i => i.productId.toString() !== productId.toString());
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} ${product.unit} available` });
      }
      if (qty > product.maxOrderQuantity) {
        return res.status(400).json({ success: false, message: `Max order is ${product.maxOrderQuantity} ${product.unit}` });
      }
      const item = cart.items.find(i => i.productId.toString() === productId.toString());
      if (item) {
        item.quantity = qty;
      } else {
        cart.items.push({ productId, quantity: qty, priceAtAdd: product.currentPrice });
      }
    }

    await cart.save();
    res.json({ success: true, message: 'Cart updated', itemCount: cart.items.length });
  } catch (error) { next(error); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = cart.items.filter(
      i => i.productId.toString() !== req.params.productId.toString()
    );
    await cart.save();
    res.json({ success: true, message: 'Item removed', itemCount: cart.items.length });
  } catch (error) { next(error); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [] },
      { upsert: true }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) { next(error); }
};
