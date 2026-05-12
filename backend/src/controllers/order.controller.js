const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const generateOrderNumber = require('../utils/generateOrderNumber');
const SMSService = require('../services/sms.service');

const SHIPPING_RATE = 7;
const FREE_SHIPPING_THRESHOLD = 200;

exports.createOrder = async (req, res) => {
  console.log('📦 CREATE ORDER CALLED', { 
    bodyKeys: Object.keys(req.body || {}),
    hasUser: !!req.user,
    userId: req.user?.id 
  });
  try {
    const { shippingAddress, paymentMethod, notes, couponCode, guestEmail, guestPhone } = req.body;

    // Get customer info from request
    const customerEmail = guestEmail || shippingAddress?.email || shippingAddress?.fullName?.includes('@') ? shippingAddress.fullName : null;
    const customerPhone = guestPhone || shippingAddress?.phone;

    // Determine user - authenticated or guest
    let userId = req.user?.id;
    let user = null;
    
    // If authenticated user, fetch the full user object
    if (userId) {
      user = await User.findById(userId);
      console.log('👤 Authenticated user found:', user?.email);
    }
    
    // If no auth, check for existing user by email in shipping or guestEmail
    if (!userId && customerEmail) {
      user = await User.findOne({ email: customerEmail.toLowerCase() });
      if (user) {
        userId = user._id;
      }
    }
    
    // Get cart
    let cart;
    const deviceId = req.headers['x-device-id'];
    
    // First check by user, then by device
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate('items.product');
    }
    if (!cart && deviceId) {
      cart = await Cart.findOne({ deviceId }).populate('items.product');
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Votre panier est vide. Ajoutez des produits avant de commander.' });
    }

    if (!customerEmail || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Email et téléphone requis pour commander.' });
    }

    // Validate stock and build order items
    const orderItems = [];
    let subtotal = 0;
    const categoryIds = [];
    const productIds = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (!product) {
        continue;
      }
      
      if (!product.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: `${product.name} is no longer available` 
        });
      }

      if (product.inventory.quantity < cartItem.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${product.inventory.quantity} of ${product.name} available` 
        });
      }

      const itemSubtotal = product.pricing.price * cartItem.quantity;
      subtotal += itemSubtotal;
      
      categoryIds.push(product.category);
      productIds.push(product._id);

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.inventory.sku,
        image: product.media.images[0],
        price: product.pricing.price,
        quantity: cartItem.quantity,
        selectedAttributes: cartItem.selectedAttributes,
        subtotal: itemSubtotal
      });

      // Reserve stock
      product.inventory.reserved += cartItem.quantity;
      await product.save();
    }

    
    // Calculate discount from coupon
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        appliedCoupon = coupon;
        discount = coupon.calculateDiscount(subtotal, categoryIds, productIds);
      }
    }
    
    // Calculate shipping
    const freeShipping = (appliedCoupon?.type === 'FREE_SHIPPING') || subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = freeShipping ? 0 : SHIPPING_RATE;

    // Professional calculation:
    // HT = discounted product subtotal + shipping
    // TVA = 19% × HT
    // TTC = HT + TVA + timbre
    const TVA_RATE = 0.19;
    const TIMBRE = paymentMethod === 'CASH_ON_DELIVERY' ? 1 : 0;
    const effectiveDiscount = discount > 0 ? discount : 0;
    const ht = (subtotal - effectiveDiscount) + shippingCost;
    const tva = Math.round(ht * TVA_RATE * 100) / 100;
    const totalWithTaxes = Math.round((ht + tva + TIMBRE) * 100) / 100;

    // Create order - always use authenticated user when logged in
    const orderUserId = req.user?.id || userId;
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: orderUserId || undefined,
      guestEmail: orderUserId ? undefined : customerEmail,
      guestPhone: orderUserId ? undefined : customerPhone,
      items: orderItems,
      shippingAddress,
      billingAddress: { sameAsShipping: true },
      pricing: {
        subtotal,
        shipping: shippingCost,
        discount,
        couponCode: appliedCoupon?.code,
        ht,
        tva,
        timbre: TIMBRE,
        total: totalWithTaxes
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING'
      },
      shipping: {
        cost: shippingCost,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      statusHistory: [{
        status: 'PENDING',
        note: 'Order placed successfully',
        timestamp: new Date()
      }],
      notes: { customer: notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Increment coupon usage
    if (appliedCoupon) {
      const userId = req.user?.id;
      const updateObj = { $inc: { 'usage.usedCount': 1 } };
      if (userId) {
        updateObj.$addToSet = { 'usage.usedBy': userId };
      }
      await Coupon.findOneAndUpdate(
        { code: appliedCoupon.code },
        updateObj
      );
    }

    // Send confirmation email
    console.log('=== Order Email Debug ===');
    console.log('user:', user ? 'yes' : 'no');
    console.log('guestEmail:', guestEmail);
    console.log('shippingAddress.fullName:', shippingAddress.fullName);
    
    if (user || guestEmail) {
      const EmailService = require('../services/email.service');
      try {
        const recipient = user || { email: guestEmail, firstName: shippingAddress.fullName };
        console.log('Sending to:', recipient.email);
        await EmailService.sendOrderConfirmation(order, recipient);
        console.log('Email sent successfully');
      } catch (emailErr) {
        console.error('Email confirmation failed:', emailErr.message);
      }
    } else {
      console.log('No email sent - no user or guestEmail');
    }
    console.log('=== End Order Email Debug ===');

    // Send SMS notification
    try {
      const phone = shippingAddress.phone || customerPhone;
      if (phone) {
        await SMSService.sendOrderSMS(order, phone);
      }
    } catch (smsErr) {
      console.error('SMS notification failed:', smsErr.message);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
        status: order.status,
        estimatedDelivery: order.shipping.estimatedDelivery
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const userEmail = (req.user.email || '').toLowerCase();
    
    let query;
    if (userEmail) {
      query = {
        $or: [
          { user: req.user.id },
          { guestEmail: userEmail }
        ]
      };
    } else {
      query = { user: req.user.id };
    }
    
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('orderNumber status pricing payment shipping createdAt user guestEmail');

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('items.product', 'name slug media');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;
    
    // Try to find by orderNumber + email for guest orders
    // or by orderNumber + user for authenticated orders
    let order;
    
    if (email) {
      // Find by order number AND email (supports guest orders)
      order = await Order.findOne({ 
        orderNumber,
        $or: [
          { guestEmail: email.toLowerCase() },
          { user: { $exists: true } }
        ]
      }).populate('items.product', 'name slug media');
      
      // Verify user email matches if order has user
      if (order && order.user) {
        const user = await User.findById(order.user);
        if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
          order = null;
        }
      }
      
      // Verify guest email matches
      if (order && !order.user && order.guestEmail?.toLowerCase() !== email.toLowerCase()) {
        order = null;
      }
    } else if (req.user?.id) {
      // Authenticated user tracking
      order = await Order.findOne({ 
        orderNumber,
        user: req.user.id
      }).populate('items.product', 'name slug media');
    }
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        payment: order.payment,
        shipping: {
          trackingNumber: order.shipping.trackingNumber,
          carrier: order.shipping.carrier,
          estimatedDelivery: order.shipping.estimatedDelivery,
          shippedAt: order.shipping.shippedAt,
          deliveredAt: order.shipping.deliveredAt
        },
        statusHistory: order.statusHistory,
        items: order.items,
        pricing: order.pricing,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update order status
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    // Stock management based on status transitions
    if (status === 'CONFIRMED') {
      // Deduct actual stock when order is confirmed
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.inventory.quantity >= item.quantity) {
          product.inventory.quantity -= item.quantity;
          if (product.inventory.reserved >= item.quantity) {
            product.inventory.reserved -= item.quantity;
          }
          await product.save();
        }
      }
    } else if (status === 'SHIPPED') {
      order.shipping.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      order.shipping.deliveredAt = new Date();
      order.payment.status = 'COMPLETED';
    } else if (status === 'CANCELLED') {
      order.payment.status = 'CANCELLED';
      
      // Release stock - if already deducted (CONFIRMED/SHIPPED/DELIVERED), restore quantity
      // If only reserved (PENDING), release reserved
      const wasConfirmed = ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(previousStatus);
      
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          if (wasConfirmed) {
            // Restore actual stock that was deducted
            product.inventory.quantity += item.quantity;
          }
          // Always release reserved stock
          if (product.inventory.reserved >= item.quantity) {
            product.inventory.reserved -= item.quantity;
          }
          await product.save();
        }
      }
    }

    await order.save();
    
    // Send status update email
    console.log('📧 Status Update Debug - order.user:', order.user, 'guestEmail:', order.guestEmail);
    const EmailService = require('../services/email.service');
    
    let recipient = null;
    if (order.user) {
      const fullUser = await User.findById(order.user);
      if (fullUser) {
        recipient = fullUser;
        console.log('📧 Sending to user:', fullUser.email);
      }
    } else if (order.guestEmail) {
      recipient = { email: order.guestEmail, firstName: order.shippingAddress?.fullName || 'Client' };
      console.log('📧 Sending to guest:', recipient.email);
    }
    
    if (recipient) {
      try {
        await EmailService.sendStatusUpdate(order, recipient);
        console.log('📧 Status update email sent');
      } catch (emailErr) {
        console.error('Status update email failed:', emailErr.message);
      }
    } else {
      console.log('📧 No recipient for status update email');
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer: Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    if (req.user) {
      if (order.user && order.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else {
      // Guest order cancellation - require email verification
      const { email } = req.body;
      if (!email || order.guestEmail?.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'Email verification required' });
      }
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled. It has already been shipped or delivered.' 
      });
    }

    // Release stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Release reserved stock
        if (product.inventory.reserved >= item.quantity) {
          product.inventory.reserved -= item.quantity;
        }
        // If already deducted (CONFIRMED), restore quantity
        if (order.status === 'CONFIRMED' && product.inventory.quantity >= 0) {
          product.inventory.quantity += item.quantity;
        }
        await product.save();
      }
    }

    // Update order status
    order.status = 'CANCELLED';
    order.payment.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: reason || 'Order cancelled by customer',
      timestamp: new Date()
    });

    await order.save();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully. Your payment will be refunded within 5-7 business days.',
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};