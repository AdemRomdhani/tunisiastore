const PaymentService = require('../services/payment.service');
const InvoiceService = require('../services/invoice.service');
const Order = require('../models/Order');

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    
    const order = await Order.findOne({ _id: orderId, user: req.user?.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let result;
    
    // Route to appropriate payment method
    switch (method) {
      case 'STRIPE':
        const customerEmail = order.user?.email || order.guestEmail;
        result = await PaymentService.createStripePayment(order, customerEmail);
        if (result.success) {
          order.payment.stripePaymentIntentId = result.paymentIntentId;
        }
        break;
        
      case 'CARD_ONLINE':
        result = await PaymentService.createKonnectPayment(order);
        break;
        
      case 'D17':
        result = await PaymentService.createD17Payment(order);
        break;
        
      case 'BANK_TRANSFER':
        result = PaymentService.getBankTransferDetails(order.orderNumber);
        break;
        
      case 'CASH_ON_DELIVERY':
      case 'EDINAR':
        result = await PaymentService.createCODPayment(order);
        break;
        
      case 'FLOUSSI':
        result = await PaymentService.createKonnectPayment(order);
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Update order with payment reference
    if (result.success && result.paymentRef) {
      order.payment.transactionId = result.paymentRef;
      order.payment.method = method;
      await order.save();
    }

    res.json({
      success: result.success,
      ...result,
      method
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bank transfer details
exports.getBankTransferDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      _id: orderId,
      $or: [{ user: req.user?.id }, { guestEmail: req.user?.email }]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const result = PaymentService.getBankTransferDetails(order.orderNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload bank transfer proof (customer)
exports.uploadBankTransferProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const order = await Order.findOne({ 
      _id: orderId,
      $or: [{ user: req.user?.id }, { guestEmail: req.user?.email }]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.method !== 'BANK_TRANSFER') {
      return res.status(400).json({ success: false, message: 'Not a bank transfer order' });
    }

    // Update order with proof
    order.payment.bankTransferProof = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      uploadedAt: new Date()
    };
    
    // Set status to pending verification
    order.payment.status = 'PENDING';
    order.statusHistory.push({
      status: 'PAYMENT_PENDING',
      note: 'Bank transfer proof uploaded - awaiting verification',
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: 'Bank transfer proof uploaded. We will verify and confirm your payment within 24-48 hours.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Verify bank transfer
exports.verifyBankTransfer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verified, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.method !== 'BANK_TRANSFER') {
      return res.status(400).json({ success: false, message: 'Not a bank transfer order' });
    }

    order.payment.bankTransferProof = {
      ...order.payment.bankTransferProof,
      verifiedAt: new Date(),
      verifiedBy: req.user?.id,
      verificationNote: note
    };

    if (verified) {
      order.payment.status = 'COMPLETED';
      order.payment.paidAt = new Date();
      order.status = 'CONFIRMED';
      order.statusHistory.push({
        status: 'CONFIRMED',
        note: note || 'Bank transfer verified',
        timestamp: new Date(),
        updatedBy: req.user?.id
      });
    } else {
      order.payment.status = 'FAILED';
      order.statusHistory.push({
        status: 'PAYMENT_FAILED',
        note: note || 'Bank transfer verification failed',
        timestamp: new Date(),
        updatedBy: req.user?.id
      });
    }

    await order.save();

    res.json({
      success: true,
      message: verified ? 'Bank transfer verified successfully' : 'Bank transfer rejected',
      order: {
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
        status: order.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process refund (admin)
exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.status !== 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot refund - payment not completed' 
      });
    }

    // Process the refund
    const refundResult = await PaymentService.processRefund(order, {
      amount: amount || order.pricing.total,
      reason,
      processedBy: req.user?.id
    });

    if (!refundResult.success) {
      return res.status(400).json(refundResult);
    }

    // Update order
    order.payment.status = 'REFUNDED';
    order.payment.refundedAt = new Date();
    order.payment.refundAmount = refundResult.amount;
    order.payment.refundReason = reason;
    order.payment.refundProcessedBy = req.user?.id;
    order.status = 'REFUNDED';
    order.statusHistory.push({
      status: 'REFUNDED',
      note: `Refund processed: ${refundResult.refundId}`,
      timestamp: new Date(),
      updatedBy: req.user?.id
    });

    await order.save();

    // Send refund confirmation email
    const EmailService = require('../services/email.service');
    const user = order.user ? await require('../models/User').findById(order.user) : null;
    if (user) {
      try {
        await EmailService.sendRefundConfirmation(order, user);
      } catch (e) {
        console.log('Refund email failed:', e.message);
      }
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: refundResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate invoice
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'supervisor';
    const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await InvoiceService.generateInvoice(order);

    // If user wants file download
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      return res.send(result.pdfBuffer);
    }

    res.json({
      success: true,
      invoiceNumber: result.invoiceNumber,
      qrData: result.qrData,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stripe webhook
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const Stripe = require('stripe');
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderNumber = paymentIntent.metadata.orderNumber;

    const order = await Order.findOne({ orderNumber: orderNumber });
    if (order && order.payment.status !== 'COMPLETED') {
      order.payment.status = 'COMPLETED';
      order.payment.paidAt = new Date();
      order.payment.stripePaymentIntentId = paymentIntent.id;
      order.status = 'CONFIRMED';
      order.statusHistory.push({
        status: 'CONFIRMED',
        note: 'Payment confirmed via Stripe',
        timestamp: new Date()
      });
      await order.save();
    }
  }

  res.json({ received: true });
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