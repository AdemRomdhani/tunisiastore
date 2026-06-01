const axios = require('axios');
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const BANK_ACCOUNT = process.env.BANK_ACCOUNT_NUMBER || '12345678901234';
const BANK_NAME = process.env.BANK_NAME || 'Banque Nationale de Tunisie (BNT)';
const BANK_IBAN = process.env.BANK_IBAN || 'TN12 1234 5678 9012 3456 7890';
const BANK_SWIFT = process.env.BANK_SWIFT || 'BNTUTNTT';

class PaymentService {
  
  // ============ STRIPE INTEGRATION ============
  
  async createStripePayment(order, customerEmail) {
    if (!stripe) {
      console.log('💳 Stripe: Not configured');
      return { success: false, error: 'Stripe not configured' };
    }

    try {
      // Create or retrieve customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            orderId: order.orderNumber
          }
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.pricing.total * 100), // Stripe uses cents
        currency: 'tnd',
        customer: customer.id,
        metadata: {
          orderNumber: order.orderNumber,
          orderId: order._id?.toString()
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      console.log('💳 Stripe: Payment intent created', paymentIntent.id);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentRef: order.orderNumber
      };
    } catch (error) {
      console.error('💳 Stripe Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async verifyStripePayment(paymentIntentId) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : paymentIntent.status,
        amount: paymentIntent.amount / 100
      };
    } catch (error) {
      console.error('💳 Stripe Verify Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createStripeRefund(refundData) {
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    try {
      const refund = await stripe.refunds.create({
        payment_intent: refundData.paymentIntentId,
        amount: Math.round(refundData.amount * 100),
        reason: refundData.reason || 'requested_by_customer'
      });

      console.log('💳 Stripe: Refund created', refund.id);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status
      };
    } catch (error) {
      console.error('💳 Stripe Refund Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ KONNECT (existing) ============
  
  async createKonnectPayment(order) {
    const { pricing, orderNumber, contact } = order;
    const amount = Math.round(pricing.total * 100);
    
    if (!process.env.KONNECT_API_KEY || !process.env.KONNECT_WALLET_ID) {
      console.log('💳 Konnect: Not configured');
      return { success: false, error: 'Konnect not configured' };
    }

    try {
      const response = await axios.post('https://api.konnect.network/api/v2/payment/initiate', {
        receiverWalletId: process.env.KONNECT_WALLET_ID,
        amount: amount,
        currency: 'TND',
        label: `Order ${orderNumber}`,
        successUrl: `${process.env.FRONTEND_URL}/payment?status=success&order=${orderNumber}`,
        failUrl: `${process.env.FRONTEND_URL}/payment?status=failed&order=${orderNumber}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment?status=cancelled&order=${orderNumber}`,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        orderId: orderNumber
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.KONNECT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('💳 Konnect: Payment initiated for order', orderNumber);
      return { success: true, paymentUrl: response.data.payUrl, paymentId: response.data.paymentId, paymentRef: orderNumber };
    } catch (error) {
      console.error('💳 Konnect Error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async verifyKonnectPayment(paymentId) {
    if (!process.env.KONNECT_API_KEY) {
      return { success: false, error: 'Konnect not configured' };
    }

    try {
      const response = await axios.get(`https://api.konnect.network/api/v2/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KONNECT_API_KEY}`
        }
      });

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount
      };
    } catch (error) {
      console.error('💳 Konnect Verify Error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ D17 (existing) ============
  
  async createD17Payment(order) {
    const { pricing, orderNumber } = order;
    const amount = pricing.total;
    
    if (!process.env.D17_MERCHANT_ID || !process.env.D17_API_KEY) {
      console.log('💳 D17: Not configured');
      return { success: false, error: 'D17 not configured' };
    }

    try {
      const response = await axios.post('https://api.d17.tn/payment/init', {
        merchantId: process.env.D17_MERCHANT_ID,
        amount: amount,
        orderId: orderNumber,
        currency: 'TND',
        returnUrl: `${process.env.FRONTEND_URL}/payment?status=success&order=${orderNumber}`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.D17_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, paymentUrl: response.data.paymentUrl, paymentRef: orderNumber };
    } catch (error) {
      console.error('💳 D17 Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ BANK TRANSFER ============
  
  getBankTransferDetails(orderNumber) {
    return {
      success: true,
      bankName: BANK_NAME,
      accountNumber: BANK_ACCOUNT,
      iban: BANK_IBAN,
      swift: BANK_SWIFT,
      amount: orderNumber.pricing?.total || 0,
      reference: `TS-${orderNumber}`,
      instructions: `
        Pour confirmer votre commande, effectuez un virement bancaire:
        
        1. Connectez-vous à votre compte bancaire en ligne
        2. Effectuez un virement de ${(orderNumber.pricing?.total || 0).toFixed(3)} TND
        3. Utilisez la référence: TS-${orderNumber}
        4. Upload le reçu dans votre espace client
        
        Votre commande sera traitée après vérification du virement.
      `.trim()
    };
  }

  // ============ CASH ON DELIVERY ============
  
  async createCODPayment(order) {
    return { 
      success: true, 
      paymentUrl: null, 
      paymentRef: order.orderNumber,
      message: 'Cash on delivery - no online payment needed'
    };
  }

  // ============ MAIN PAYMENT ROUTER ============
  
  async initiatePayment(order, paymentMethod) {
    const contact = {
      email: order.user?.email || order.guestEmail,
      phone: order.user?.phone || order.guestPhone
    };

    switch (paymentMethod) {
      case 'STRIPE':
        return await this.createStripePayment(order, contact.email);
      
      case 'CARD_ONLINE':
      case 'D17':
        return await this.createKonnectPayment(order);
      
      case 'FLOUSSI':
        // Use Konnect for Floussi
        return await this.createKonnectPayment(order);
      
      case 'BANK_TRANSFER':
        return this.getBankTransferDetails(order);
      
      case 'CASH_ON_DELIVERY':
        return await this.createCODPayment(order);
      
      case 'EDINAR':
        // Similar to COD
        return await this.createCODPayment(order);
      
      default:
        return { success: false, error: 'Unknown payment method' };
    }
  }

  async verifyPayment(paymentMethod, transactionId) {
    switch (paymentMethod) {
      case 'STRIPE':
        return await this.verifyStripePayment(transactionId);
      
      case 'D17':
      case 'CARD_ONLINE':
        return await this.verifyKonnectPayment(transactionId);
      
      case 'BANK_TRANSFER':
        return { success: true, status: 'PENDING', message: 'Bank transfer verification required' };
      
      case 'CASH_ON_DELIVERY':
        return { success: true, status: 'PENDING', message: 'Payment on delivery' };
      
      default:
        return { success: false, error: 'Unknown payment method' };
    }
  }

  // ============ REFUND PROCESSING ============
  
  async processRefund(order, refundData) {
    const { amount, reason, processedBy } = refundData;
    
    // Check if order is eligible for refund
    if (order.payment.status !== 'COMPLETED') {
      return { success: false, error: 'Order not paid - cannot refund' };
    }

    if (order.payment.method === 'CASH_ON_DELIVERY') {
      return { success: false, error: 'Cash on delivery orders cannot be refunded online' };
    }

    let refundResult;

    // Process refund based on payment method
    if (order.payment.method === 'STRIPE' && order.payment.stripePaymentIntentId) {
      refundResult = await this.createStripeRefund({
        paymentIntentId: order.payment.stripePaymentIntentId,
        amount: amount || order.pricing.total,
        reason: reason || 'requested_by_customer'
      });
    } else if (order.payment.method === 'BANK_TRANSFER') {
      // Manual bank transfer refund
      refundResult = { success: true, refundId: `BT-REF-${uuidv4()}`, status: 'pending_manual' };
    } else {
      // For other methods, create a pending refund
      refundResult = { success: true, refundId: `REF-${uuidv4()}`, status: 'pending' };
    }

    if (!refundResult.success) {
      return refundResult;
    }

    // Return the refund details
    return {
      success: true,
      refundId: refundResult.refundId,
      amount: amount || order.pricing.total,
      status: refundResult.status || 'PROCESSING',
      message: refundResult.message || 'Refund initiated successfully'
    };
  }
}

module.exports = new PaymentService();