const Cart = require('../models/Cart');
const Product = require('../models/Product');
const EmailService = require('../services/email.service');
const CacheService = require('../services/cache.service');

// Configuration
const ABANDONMENT_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
const REMINDER_INTERVALS = [
  { delay: 2 * 60 * 60 * 1000, label: '2h' },   // 2 hours
  { delay: 24 * 60 * 60 * 1000, label: '1d' },  // 1 day
];
const MAX_REMINDERS = 2;

class AbandonedCartService {
  /**
   * Find abandoned carts and send recovery emails
   */
  async processAbandonedCarts() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - ABANDONMENT_THRESHOLD_MS);

    console.log('[AbandonedCart] Checking for abandoned carts...');

    try {
      // Find abandoned carts (exclude already recovered)
      const abandonedCarts = await Cart.find({
        'items.0': { $exists: true },
        lastModified: { $lte: cutoff },
        $or: [
          { isRecovered: { $exists: false } },
          { isRecovered: false }
        ],
        $and: [
          {
            $or: [
              { user: { $ne: null } },
              { guestEmail: { $exists: true, $ne: null } }
            ]
          },
          {
            $or: [
              { reminderCount: { $lt: MAX_REMINDERS } },
              { reminderCount: { $exists: false } }
            ]
          }
        ]
      }).populate('items.product', 'name slug pricing media').populate('user', 'firstName email');

      console.log(`[AbandonedCart] Found ${abandonedCarts.length} abandoned carts`);

      const results = [];
      for (const cart of abandonedCarts) {
        try {
          const result = await this.sendRecoveryReminder(cart);
          results.push(result);
        } catch (err) {
          console.error(`[AbandonedCart] Error processing cart ${cart._id}:`, err.message);
          results.push({ cartId: cart._id, success: false, email: (cart.user || {}).email || cart.guestEmail, error: err.message });
        }
      }

      console.log(`[AbandonedCart] Processed: ${results.length}, Sent: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`);

      return {
        success: true,
        processed: results.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      };
    } catch (error) {
      console.error('[AbandonedCart] Service error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a recovery reminder for a specific cart
   */
  async sendRecoveryReminder(cart) {
    const reminderCount = (cart.reminderCount || 0) + 1;
    const lastReminder = cart.lastReminderAt;

    // Check if enough time has passed since last reminder
    if (lastReminder) {
      const hoursSinceLastReminder = (Date.now() - new Date(lastReminder).getTime()) / (60 * 60 * 1000);
      if (hoursSinceLastReminder < 24) {
        return { cartId: cart._id, success: false, email: (cart.user || {}).email || cart.guestEmail, reason: 'Too soon since last reminder' };
      }
    }

    const email = (cart.user || {}).email || cart.guestEmail;
    if (!email) {
      return { cartId: cart._id, success: false, email: null, reason: 'No email address' };
    }

    // Calculate cart total
    let subtotal = 0;
    let itemCount = 0;
    const cartItems = [];
    for (const item of (cart.items || [])) {
      if (item.product) {
        const price = (item.product.pricing || {}).price || 0;
        subtotal += price * (item.quantity || 1);
        itemCount += (item.quantity || 1);
        cartItems.push({
          name: item.product.name,
          quantity: item.quantity || 1,
          price: price,
          image: ((item.product.media || {}).images || [])[0],
          productUrl: `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/products/${item.product.slug}`
        });
      }
    }

    if (cartItems.length === 0) {
      return { cartId: cart._id, success: false, email, reason: 'Cart has no valid items' };
    }

    // Generate recovery URL
    const recoveryToken = Buffer.from(`${cart._id}:${Date.now()}`).toString('base64');
    const recoveryUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/cart?recover=${recoveryToken}`;

    // Build email data
    const emailData = {
      user: {
        firstName: ((cart.user || {}).firstName || 'Valued Customer').toString(),
        email
      },
      cartItems,
      subtotal,
      cartUrl: recoveryUrl,
      reminderCount,
      hasDiscount: reminderCount > 1
    };

    // Send the email
    try {
      if (EmailService.sendAbandonedCart) {
        await EmailService.sendAbandonedCart(emailData);
      } else {
        // Fallback
        console.log(`[AbandonedCart] Would send email to ${email} with ${cartItems.length} items (subtotal: ${subtotal} TND)`);
      }
    } catch (err) {
      console.error('[AbandonedCart] Email sending failed:', err.message);
      return { cartId: cart._id, success: false, email, reason: 'Email sending failed: ' + err.message };
    }

    // Update cart reminder status
    cart.reminderCount = reminderCount;
    cart.lastReminderAt = new Date();
    await cart.save();

    console.log(`[AbandonedCart] Reminder #${reminderCount} sent to ${email} for cart ${cart._id}`);

    return {
      cartId: cart._id,
      success: true,
      email,
      reminderCount,
      itemCount: cartItems.length,
      subtotal
    };
  }

  /**
   * Mark a cart as recovered (when user completes order)
   */
  async markCartRecovered(cartId) {
    const cart = await Cart.findById(cartId);
    if (cart) {
      cart.isRecovered = true;
      cart.recoveredAt = new Date();
      await cart.save();
      
      // Invalidate cart cache
      await CacheService.invalidateCart(cart.user?.toString() || null, cart.deviceId);
    }
  }

  /**
   * Get statistics for abandoned carts
   */
  async getStats() {
    const cutoff = new Date(Date.now() - ABANDONMENT_THRESHOLD_MS);

    const totalCarts = await Cart.countDocuments({ 'items.0': { $exists: true } });
    const abandonedCount = await Cart.countDocuments({
      'items.0': { $exists: true },
      lastModified: { $lte: cutoff },
      $and: [
        {
          $or: [
            { isRecovered: { $exists: false } },
            { isRecovered: false }
          ]
        },
        {
          $or: [
            { user: { $ne: null } },
            { guestEmail: { $exists: true, $ne: null } }
          ]
        }
      ]
    });
    const recoveredCount = await Cart.countDocuments({ isRecovered: true });
    const reminderSent = await Cart.countDocuments({ reminderCount: { $gt: 0 } });

    return {
      totalCarts,
      abandonedCount,
      recoveredCount,
      reminderSent,
      recoveryRate: recoveredCount > 0 && abandonedCount > 0 ? (recoveredCount / abandonedCount * 100).toFixed(2) : 0
    };
  }
}

module.exports = new AbandonedCartService();
