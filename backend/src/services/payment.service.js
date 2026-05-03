const axios = require('axios');

class PaymentService {
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

  async createCODPayment(order) {
    return { 
      success: true, 
      paymentUrl: null, 
      paymentRef: order.orderNumber,
      message: 'Cash on delivery - no online payment needed'
    };
  }
}

module.exports = new PaymentService();