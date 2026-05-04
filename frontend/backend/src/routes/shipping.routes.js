const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ShippingService = require('../services/shipping.service');

router.post('/create', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { orderId, carrier } = req.body;
    const Order = require('../models/Order');
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be shipped. It must be confirmed or processing.' 
      });
    }

    const shipment = await ShippingService.createShipment(order, carrier);

    order.shipping.carrier = carrier;
    order.shipping.trackingNumber = shipment.trackingNumber;
    order.shipping.estimatedDelivery = shipment.estimatedDelivery;
    order.status = 'SHIPPED';
    order.statusHistory.push({
      status: 'SHIPPED',
      note: `Shipped via ${shipment.carrierName}. Tracking: ${shipment.trackingNumber}`,
      timestamp: new Date()
    });

    await order.save();

    res.json({ 
      success: true, 
      shipment,
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/track', async (req, res) => {
  try {
    const { trackingNumber, carrier } = req.body;
    const tracking = await ShippingService.trackShipment(trackingNumber, carrier);
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/carriers', (req, res) => {
  const carriers = ShippingService.getAvailableCarriers();
  res.json({ success: true, carriers });
});

router.get('/cost', (req, res) => {
  const { governorate, carrier } = req.query;
  const cost = ShippingService.calculateShippingCost(carrier || 'poste', governorate);
  res.json({ success: true, cost, governorate, carrier });
});

module.exports = router;