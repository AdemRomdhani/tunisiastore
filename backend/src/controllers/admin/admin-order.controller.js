const Order = require('../../models/Order');
const SMSService = require('../../services/sms.service');

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({ status: 'PENDING' });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    if (status === 'SHIPPED') order.shipping.shippedAt = new Date();
    if (status === 'DELIVERED') {
      order.shipping.deliveredAt = new Date();
      order.payment.status = 'COMPLETED';
    }

    await order.save();

    // Send status update email
    console.log('📧 Admin Status Update Debug - order.user:', order.user, 'guestEmail:', order.guestEmail);
    const EmailService = require('../../services/email.service');
    const User = require('../../models/User');
    
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

    // Send SMS notification for shipping/delivery
    try {
      const phone = order.shippingAddress?.phone || order.guestPhone;
      if (phone && (status === 'SHIPPED' || status === 'DELIVERED')) {
        if (status === 'SHIPPED') {
          await SMSService.sendDeliverySMS(order.orderNumber, phone);
        }
      }
    } catch (smsErr) {
      console.error('SMS notification failed:', smsErr.message);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status, note } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Order IDs required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });

    for (const order of orders) {
      order.status = status;
      order.statusHistory.push({
        status,
        note: note || `Bulk update: ${status}`,
        updatedBy: req.user.id,
        timestamp: new Date()
      });
      if (status === 'SHIPPED') order.shipping.shippedAt = new Date();
      if (status === 'DELIVERED') {
        order.shipping.deliveredAt = new Date();
        order.payment.status = 'COMPLETED';
      }
      await order.save();
    }

    res.json({ success: true, updated: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addOrderNote = async (req, res) => {
  try {
    const { note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.internalNotes = order.internalNotes || [];
    order.internalNotes.push({
      text: note,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await order.save();
    res.json({ success: true, internalNotes: order.internalNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderNotes = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('internalNotes');
    res.json({ success: true, internalNotes: order?.internalNotes || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportOrders = async (req, res) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({ success: true, orders });
    }

    const separator = ';';
    const statusLabels = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En préparation',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée'
    };
    const paymentStatusLabels = {
      'PENDING': 'En attente',
      'COMPLETED': 'Payé',
      'FAILED': 'Échoué',
      'REFUNDED': 'Remboursé'
    };

    const csvHeader = `N° Commande${separator}Client${separator}Email${separator}Téléphone${separator}Total (DT)${separator}Statut${separator}Paiement${separator}Date\n`;
    const csvRows = orders.map(o => {
      const user = o.user || {};
      const customerName = o.guestName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
      return `${o.orderNumber}${separator}${customerName}${separator}${user.email || o.guestEmail || ''}${separator}${o.shippingAddress?.phone || o.guestPhone || ''}${separator}${(o.pricing?.total || 0).toFixed(3)}${separator}${statusLabels[o.status] || o.status}${separator}${paymentStatusLabels[o.payment?.status] || o.payment?.status || ''}${separator}${new Date(o.createdAt).toLocaleDateString('fr-TN')}`;
    }).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=commandes-${Date.now()}.csv`);
    res.send(bom + csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.printInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone addresses')
      .populate('items.product', 'name pricing images sku');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const invoice = {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.user ? {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone,
        address: order.shippingAddress
      } : {
        name: order.guestName || 'Guest',
        email: order.guestEmail,
        phone: order.guestPhone,
        address: order.shippingAddress
      },
      items: order.items.map(item => ({
        name: item.name || item.product?.name,
        sku: item.sku || item.product?.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      })),
      pricing: order.pricing,
      payment: order.payment,
      shipping: order.shipping
    };

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
