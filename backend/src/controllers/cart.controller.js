const Cart = require('../models/Cart');
const Product = require('../models/Product');
const CacheService = require('../services/cache.service');

exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const deviceId = req.headers['x-device-id'];
    
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug pricing media inventory badges isActive');
      
      // If user has no cart but device has one, migrate it to the user
      if (!cart && deviceId) {
        const deviceCart = await Cart.findOne({ deviceId }).populate('items.product', 'name slug pricing media inventory badges isActive');
        if (deviceCart) {
          deviceCart.user = userId;
          await deviceCart.save();
          cart = deviceCart;
        }
      }
    } else if (deviceId) {
      cart = await Cart.findOne({ deviceId }).populate('items.product', 'name slug pricing media inventory badges isActive');
    }

    if (!cart) {
      // Return empty cart for non-existent
      return res.json({
        success: true,
        cart: { items: [], subtotal: 0, itemCount: 0 }
      });
    }

    // Calculate totals
    let subtotal = 0;
    const validItems = [];

    for (const item of cart.items) {
      if (item.product && item.product.isActive) {
        const price = item.product.pricing.price;
        subtotal += price * item.quantity;
        validItems.push(item);
      }
    }

    // Remove invalid items
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({
      success: true,
      cart: {
        items: validItems,
        subtotal,
        itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, attributes } = req.body;
    let userId = req.user?.id || null;
    let deviceId = req.headers['x-device-id'];
    
    // Handle boolean values from headers
    if (deviceId === true || deviceId === 'true') {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    }
    if (userId === true || userId === 'true') {
      userId = null;
    }
    
    // Ensure deviceId is a valid string
    if (!deviceId || typeof deviceId !== 'string') {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    }

    console.log('Add to cart request:', { productId, quantity, userId: userId ? 'has-user' : 'no-user', deviceId: deviceId.substring(0, 15) });

    // Validate productId
    if (!productId || typeof productId !== 'string') {
      console.log('Invalid productId:', productId);
      return res.status(400).json({ success: false, message: 'Product ID requis' });
    }

    // Check if productId is a valid MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid ObjectId format:', productId);
      return res.status(400).json({ success: false, message: 'ID produit invalide' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!product.isActive) {
      console.log('Product not active:', productId);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check available stock (quantity - reserved), handle missing inventory
    const inventory = product.inventory || { quantity: 0, reserved: 0 };
    const availableStock = (inventory.quantity || 0) - (inventory.reserved || 0);
    if (availableStock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: availableStock === 0 ? 'Rupture de stock' : `Plus que ${availableStock} exemplaire(s) disponible(s)`
      });
    }

    // Find or create cart
    let cart;
    
    // If user is logged in, try to find cart by user first
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      // If no user cart but has device cart, migrate device cart to user
      if (!cart && deviceId) {
        const deviceCart = await Cart.findOne({ deviceId: deviceId });
        if (deviceCart) {
          deviceCart.user = userId;
          await deviceCart.save();
          cart = deviceCart;
        }
      }
    }
    
    // If no user cart, try device cart
    if (!cart && deviceId && typeof deviceId === 'string') {
      cart = await Cart.findOne({ deviceId: deviceId });
    }
    
    // If still no cart, create new one
    if (!cart) {
      const cartData = userId ? { user: userId } : { deviceId: deviceId };
      try {
        cart = await Cart.create(cartData);
      } catch (err) {
        console.error('Create cart error:', err.code, err.message);
        // If creation fails, try to find existing one
        if (userId) {
          cart = await Cart.findOne({ user: userId });
        } else if (deviceId) {
          cart = await Cart.findOne({ deviceId: deviceId });
        }
      }
    }
    
    if (!cart) {
      return res.status(500).json({ success: false, message: 'Impossible de créer le panier' });
    }

    // Ensure cart has items array
    if (!cart.items) {
      cart.items = [];
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
      JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes)
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity;
      const prodInventory = product.inventory || { quantity: 0 };
      if ((prodInventory.quantity || 0) < newQty) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add more. Stock limit: ${prodInventory.quantity || 0}` 
        });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity, selectedAttributes: attributes });
    }

    await cart.save();
    
    // Invalidate cart cache
    await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug pricing media inventory badges isActive');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;
    const deviceId = req.headers['x-device-id'];

    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      if (!cart && deviceId) {
        cart = await Cart.findOne({ deviceId });
        if (cart) {
          cart.user = userId;
          await cart.save();
        }
      }
    } else if (deviceId) {
      cart = await Cart.findOne({ deviceId });
    }
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (quantity <= 0) {
      item.remove();
    } else {
      const product = await Product.findById(item.product);
      const inventory = product.inventory || { quantity: 0, reserved: 0 };
      const availableStock = (inventory.quantity || 0) - (inventory.reserved || 0);
      if (availableStock < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: availableStock === 0 ? 'Rupture de stock' : `Plus que ${availableStock} disponible(s)`
        });
      }
      item.quantity = quantity;
    }

    await cart.save();
    
    // Invalidate cart cache
    await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug pricing media inventory badges isActive');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const deviceId = req.headers['x-device-id'];
    
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      if (!cart && deviceId) {
        cart = await Cart.findOne({ deviceId });
        if (cart) {
          cart.user = userId;
          await cart.save();
        }
      }
    } else if (deviceId) {
      cart = await Cart.findOne({ deviceId });
    }
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    // Invalidate cart cache
    await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug pricing media inventory badges isActive');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const deviceId = req.headers['x-device-id'] || null;
    
    const query = userId ? { user: userId } : { deviceId };
    
    const cart = await Cart.findOneAndUpdate(
      query,
      { items: [] },
      { new: true }
    );

    // Invalidate cart cache
    if (cart) {
      await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    }
    
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set guest email for checkout tracking and abandoned cart recovery
exports.setGuestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    
    const userId = req.user?.id || null;
    const deviceId = req.headers['x-device-id'];
    
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      // Update user record too
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { 'contactInfo.email': email });
    } else if (deviceId) {
      cart = await Cart.findOne({ deviceId });
    }
    
    if (cart) {
      cart.guestEmail = email;
      await cart.save();
      
      // Invalidate cart cache
      await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    }
    
    res.json({ success: true, message: 'Email saved for checkout' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set guest phone for checkout tracking and SMS notifications
exports.setGuestPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    const userId = req.user?.id || null;
    const deviceId = req.headers['x-device-id'];
    
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { 'contactInfo.phone': phone });
    } else if (deviceId) {
      cart = await Cart.findOne({ deviceId });
    }
    
    if (cart) {
      cart.guestPhone = phone;
      await cart.save();
      
      await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    }
    
    res.json({ success: true, message: 'Phone saved for checkout' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
