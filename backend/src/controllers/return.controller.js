const jwt = require('jsonwebtoken');
const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function getUserFromRequest(req) {
  if (req.user) return req.user;
  
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const User = require('../models/User');
      return await User.findById(decoded.userId).select('-password');
    } catch (e) {}
  }
  return null;
}

exports.createReturn = async (req, res) => {
  try {
    const { orderId, items, reason, description, type, images, email } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const user = await getUserFromRequest(req);
    console.log('Return request - user:', user?.id, 'email:', email, 'order.user:', order.user);
    
    // Verify ownership
    if (user) {
      if (order.user && order.user.toString() !== user.id) {
        return res.status(403).json({ success: false, message: 'Non autorisé pour cette commande' });
      }
    } else {
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email requis pour les commandes guest' });
      }
      const orderEmail = order.guestEmail?.toLowerCase() || order.user?.email?.toLowerCase();
      if (orderEmail && email.toLowerCase() !== orderEmail) {
        return res.status(403).json({ success: false, message: 'Email non correspondant à la commande' });
      }
    }

    // Check if order is delivered or within return window
    const deliveryDate = new Date(order.shipping.deliveredAt);
    const returnWindow = 14 * 24 * 60 * 60 * 1000; // 14 days
    if (order.status !== 'DELIVERED' || (Date.now() - deliveryDate.getTime()) > returnWindow) {
      return res.status(400).json({ 
        success: false, 
        message: 'Returns only available within 14 days of delivery' 
      });
    }

    // Calculate refund amount
    const returnItems = items.map(item => {
      const orderItem = order.items.find(i => i.product.toString() === item.productId);
      return {
        product: item.productId,
        name: orderItem?.name,
        image: orderItem?.image,
        quantity: item.quantity,
        price: orderItem?.price,
        reason: item.reason
      };
    });

    const refundAmount = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const returnRequest = await Return.create({
      order: orderId,
      user: user?.id,
      guestEmail: order.guestEmail || email,
      items: returnItems,
      type,
      reason,
      description,
      images: images || [],
      status: 'PENDING',
      refundAmount,
      timeline: [{
        status: 'PENDING',
        note: 'Return request submitted',
        timestamp: new Date()
      }]
    });

    const EmailService = require('../services/email.service');
    const User = require('../models/User');
    const fullUser = user ? await User.findById(user.id) : null;
    try {
      await EmailService.sendReturnConfirmation(returnRequest, order, fullUser || { email: order.guestEmail || email });
    } catch (emailErr) {
      console.error('Return confirmation email failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      returnRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyReturns = async (req, res) => {
  try {
    const query = req.user ? { user: req.user.id } : { guestEmail: req.query.email };
    
    const returns = await Return.find(query)
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReturn = async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id)
      .populate('order')
      .populate('items.product');

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    // Verify ownership
    if (req.user) {
      if (returnRequest.user?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else if (returnRequest.guestEmail !== req.query.email) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, return: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all returns
exports.getAllReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const returns = await Return.find(query)
      .populate('order')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Return.countDocuments(query);

    res.json({
      success: true,
      returns,
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

// Admin: Update return status
exports.updateReturn = async (req, res) => {
  try {
    const { status, adminNotes, refundMethod } = req.body;
    
    const returnRequest = await Return.findById(req.params.id).populate('order');
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    const previousStatus = returnRequest.status;
    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    if (refundMethod) returnRequest.refundMethod = refundMethod;
    if (status === 'REFUNDED') {
      returnRequest.timeline.push({
        status: 'REFUNDED',
        note: `Refund processed via ${refundMethod}`,
        timestamp: new Date(),
        updatedBy: req.user.id
      });
    } else {
      returnRequest.timeline.push({
        status,
        note: adminNotes || `Status updated to ${status}`,
        timestamp: new Date(),
        updatedBy: req.user.id
      });
    }

    await returnRequest.save();

    if (previousStatus !== status) {
      const EmailService = require('../services/email.service');
      const User = require('../models/User');
      const fullUser = returnRequest.user ? await User.findById(returnRequest.user) : null;
      try {
        await EmailService.sendReturnStatusUpdate(
          returnRequest,
          returnRequest.order,
          fullUser || { email: returnRequest.guestEmail },
          status,
          adminNotes
        );
      } catch (emailErr) {
        console.error('Return status update email failed:', emailErr.message);
      }
    }

    res.json({ success: true, return: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};