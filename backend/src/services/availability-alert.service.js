const User = require('../models/User');
const Product = require('../models/Product');
const emailService = require('./email.service');

class AvailabilityAlertService {
  async notifyUsers(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product || !product.inventory?.quantity || product.inventory.quantity <= 0) {
        return { success: false, message: 'Product not in stock' };
      }

      // Find users with alerts for this product
      const users = await User.find({
        'availabilityAlerts.product': productId,
        'availabilityAlerts.notified': false
      }).populate('availabilityAlerts.product', 'name slug pricing media');

      if (users.length === 0) {
        return { success: true, message: 'No pending alerts for this product' };
      }

      const notifiedUsers = [];

      for (const user of users) {
        const alert = user.availabilityAlerts.find(
          a => a.product.toString() === productId.toString() && !a.notified
        );

        if (!alert) continue;

        const userEmail = user.email || user.contactInfo?.email;
        
        if (userEmail) {
          try {
            await this.sendNotificationEmail(userEmail, product, user);
            alert.notified = true;
            alert.notifiedAt = new Date();
            notifiedUsers.push(user._id);
          } catch (err) {
            console.error(`Failed to notify user ${user._id}:`, err.message);
          }
        }
      }

      await User.updateMany(
        { _id: { $in: notifiedUsers } },
        { 
          $set: { 'availabilityAlerts.$[elem].notified': true, 'availabilityAlerts.$[elem].notifiedAt': new Date() } 
        },
        { arrayFilters: [{ 'elem.product': productId }] }
      );

      return { 
        success: true, 
        notified: notifiedUsers.length,
        productName: product.name 
      };
    } catch (error) {
      console.error('Availability alert error:', error);
      return { success: false, message: error.message };
    }
  }

  async sendNotificationEmail(email, product, user) {
    const productUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/products/${product.slug}`;
    const imageUrl = product.media?.[0] || '';
    const price = product.pricing?.price || 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Produit disponible!</h1>
            </div>
            
            <div style="padding: 24px;">
              <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">
                Bonjour ${user.firstName || 'cher client'},
              </p>
              
              <p style="color: #334155; font-size: 16px; margin: 0 0 20px;">
                Le produit que vous attendiez est maintenant <strong>disponible en stock</strong>!
              </p>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; display: flex; gap: 16px; align-items: center;">
                ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : ''}
                <div>
                  <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 18px;">${product.name}</h3>
                  <p style="margin: 0; color: #dc2626; font-size: 20px; font-weight: bold;">${price.toFixed(3)} TND</p>
                </div>
              </div>
              
              <a href="${productUrl}" style="display: inline-block; margin-top: 20px; padding: 14px 28px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Commander maintenant
              </a>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                Veuillez noter que les stocks sont limités. Nous vous recommandons de commander rapidement.
              </p>
            </div>
            
            <div style="background: #f1f5f9; padding: 16px; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                © 2026 Tunisia Store. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: email,
      subject: `✅ ${product.name} est maintenant disponible!`,
      html
    });
  }

  async checkAndNotifyAll() {
    const products = await Product.find({
      'inventory.quantity': { $gt: 0 },
      isActive: true
    });

    let totalNotified = 0;
    for (const product of products) {
      const result = await this.notifyUsers(product._id);
      if (result.success && result.notified) {
        totalNotified += result.notified;
      }
    }

    return { totalNotified };
  }

  async getAlertsByProduct(productId) {
    const users = await User.find({
      'availabilityAlerts.product': productId
    }).select('firstName email contactInfo.email availabilityAlerts');

    return users.map(user => ({
      userId: user._id,
      email: user.email || user.contactInfo?.email,
      firstName: user.firstName,
      alert: user.availabilityAlerts?.find(a => a.product.toString() === productId.toString())
    })).filter(u => u.alert);
  }
}

module.exports = new AvailabilityAlertService();