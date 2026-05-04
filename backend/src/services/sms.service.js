const axios = require('axios');

class SMSService {
  async sendSMSTO(phone, message) {
    const apiKey = process.env.SMS_TO_KEY;
    if (!apiKey || apiKey === 'your_key') {
      console.log('📱 SMS.to: Not configured (SMS_TO_KEY missing)');
      return { success: false, error: 'API key not configured' };
    }
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+216${phone.replace(/\s/g, '')}`;
      console.log('📱 SMS.to: Sending SMS to', formattedPhone, 'with message:', message);
      
      const response = await axios.post('https://api.sms.to/sms/send', {
        to: formattedPhone,
        message: message,
        from_number: 'TunisiaStore'
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📱 SMS.to: Success!', response.data);
      return response.data;
    } catch (error) {
      console.error('📱 SMS.to Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async sendTunisiaSMS(phone, message) {
    if (!process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'your_key') {
      return this.sendSMSTO(phone, message);
    }
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+216${phone.replace(/\s/g, '')}`;
      
      const response = await axios.post('https://api.sms.tn/send', {
        apiKey: process.env.SMS_API_KEY,
        to: formattedPhone,
        message: message,
        sender: 'TunisiaStore'
      });
      
      return response.data;
    } catch (error) {
      console.error('SMS Tunisia Error:', error.message);
      return this.sendSMSTO(phone, message);
    }
  }

  async sendTwilioSMS(phone, message) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_PHONE) {
      return this.sendSMSTO(phone, message);
    }
    
    try {
      const accountSid = process.env.TWILIO_SID;
      const authToken = process.env.TWILIO_TOKEN;
      const client = require('twilio')(accountSid, authToken);
      
      const formattedPhone = phone.startsWith('+') ? phone : `+216${phone.replace(/\s/g, '')}`;
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: formattedPhone
      });
      
      console.log('📱 Twilio: SMS sent to', formattedPhone);
    } catch (error) {
      console.error('Twilio Error:', error.message);
      this.sendSMSTO(phone, message);
    }
  }

  async sendOrderSMS(order, phone) {
    const message = `Tunisia Store: Commande ${order.orderNumber} confirmee. Total: ${order.pricing.total.toFixed(3)} TND. Merci!`;
    return this.sendSMSTO(phone, message);
  }

  async sendDeliverySMS(orderNumber, phone) {
    const message = `Tunisia Store: Votre commande ${orderNumber} est en cours de livraison. Preparez-vous!`;
    return this.sendSMSTO(phone, message);
  }
}

module.exports = new SMSService();