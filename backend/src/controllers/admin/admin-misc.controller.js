// Availability Alerts
exports.getProductAlerts = async (req, res) => {
  try {
    const AvailabilityAlertService = require('../../services/availability-alert.service');
    const alerts = await AvailabilityAlertService.getAlertsByProduct(req.params.productId);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.notifyAvailability = async (req, res) => {
  try {
    const AvailabilityAlertService = require('../../services/availability-alert.service');
    const result = await AvailabilityAlertService.notifyUsers(req.params.productId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Abandoned carts
exports.getAbandonedCarts = async (req, res) => {
  try {
    const Cart = require('../../models/Cart');
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const carts = await Cart.find({
      items: { $exists: true, $ne: [] },
      isRecovered: { $ne: true }
    })
      .populate('items.product', 'name slug pricing media')
      .populate('user', 'firstName lastName email phone')
      .sort({ lastModified: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cart.countDocuments({
      items: { $exists: true, $ne: [] },
      isRecovered: { $ne: true }
    });

    res.json({
      success: true,
      carts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAbandonedCartStats = async (req, res) => {
  try {
    const AbandonedCartService = require('../../services/abandoned-cart.service');
    const stats = await AbandonedCartService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const AuditService = require('../../services/audit.service');
    const { page = 1, limit = 50, action, category, userId, startDate, endDate } = req.query;
    const result = await AuditService.queryLogs(
      {},
      { page: parseInt(page), limit: parseInt(limit), action, category, userId, startDate, endDate }
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditSecurityEvents = async (req, res) => {
  try {
    const AuditService = require('../../services/audit.service');
    const { days = 7 } = req.query;
    const events = await AuditService.getSecurityEvents(parseInt(days));
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditUserActivity = async (req, res) => {
  try {
    const AuditService = require('../../services/audit.service');
    const { days = 30 } = req.query;
    const activity = await AuditService.getUserActivity(req.params.userId, parseInt(days));
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test email
exports.testEmail = async (req, res) => {
  try {
    const EmailService = require('../../services/email.service');
    const User = require('../../models/User');

    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    const testOrder = {
      orderNumber: 'TEST-' + Date.now(),
      items: [{ name: 'Test Product', quantity: 1, price: 100 }],
      pricing: { subtotal: 100, shipping: 7, total: 107 },
      shipping: { estimatedDelivery: new Date() }
    };

    await EmailService.sendOrderConfirmation(testOrder, user);
    await EmailService.sendStatusUpdate(testOrder, user);
    res.json({ success: true, smtpConfigured: true, message: 'Emails sent - check your inbox (and spam folder)' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
