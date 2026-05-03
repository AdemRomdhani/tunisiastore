const PaymentService = require('../services/payment.service');
const Order = require('../models/Order');

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let result;
    switch (method) {
      case 'CARD_ONLINE':
        result = await PaymentService.createKonnectPayment(order);
        break;
      case 'D17':
        result = await PaymentService.createD17Payment(order);
        break;
      case 'CASH_ON_DELIVERY':
        result = await PaymentService.createCODPayment(order);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Update order with payment reference
    order.payment.transactionId = result.paymentRef;
    await order.save();

    res.json({
      success: true,
      paymentUrl: result.paymentUrl,
      paymentRef: result.paymentRef
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentRef } = req.params;
    
    const paymentData = await PaymentService.verifyKonnectPayment(paymentRef);
    
    if (paymentData.status === 'completed') {
      const order = await Order.findOne({ 'payment.transactionId': paymentRef });
      if (order) {
        order.payment.status = 'PAID';
        order.payment.paidAt = new Date();
        order.status = 'CONFIRMED';
        order.statusHistory.push({
          status: 'CONFIRMED',
          note: 'Payment verified via Konnect',
          timestamp: new Date()
        });
        await order.save();
      }
    }

    res.json({ success: true, payment: paymentData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Webhook for Konnect callbacks
exports.webhook = async (req, res) => {
  try {
    const { paymentRef, status } = req.body;
    
    if (status === 'completed') {
      const order = await Order.findOne({ 'payment.transactionId': paymentRef });
      if (order && order.payment.status !== 'PAID') {
        order.payment.status = 'PAID';
        order.payment.paidAt = new Date();
        order.status = 'CONFIRMED';
        order.statusHistory.push({
          status: 'CONFIRMED',
          note: 'Payment confirmed via webhook',
          timestamp: new Date()
        });
        await order.save();
        
        // Send confirmation email/SMS here
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
};