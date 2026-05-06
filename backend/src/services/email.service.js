const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let resend;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('📧 [Email] Resend client initialized successfully');
  } else {
    resend = null;
    console.log('📧 [Email] Resend client NOT initialized - no API key');
  }
} catch (err) {
  console.error('📧 [Email] Failed to initialize Resend:', err.message);
  resend = null;
}

// Log API key status on startup
console.log('📧 [Email] ==========');
console.log('📧 [Email] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
console.log('📧 [Email] RESEND_API_KEY value:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET');
console.log('📧 [Email] ==========');

class EmailService {
  async sendOrderConfirmation(order, user) {
    if (!resend) {
      console.log('📧 [Email] Skipped - Resend not initialized');
      return;
    }
    
    console.log('📧 [Email] Sending order confirmation to:', user.email);
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(3)} TND</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>Tunisia Store</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Confirmation de commande</h2>
          <p>Bonjour ${user.firstName},</p>
          <p>Votre commande <strong>${order.orderNumber}</strong> a été confirmée.</p>
          
          <table style="width: 100%; background: white; border-radius: 8px; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: center;">Qté</th>
                <th style="padding: 10px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="background: white; padding: 15px; border-radius: 8px;">
            <p style="display: flex; justify-content: space-between;"><span>Sous-total:</span> <strong>${order.pricing.subtotal.toFixed(3)} TND</strong></p>
            <p style="display: flex; justify-content: space-between;"><span>Livraison:</span> <strong>${order.pricing.shipping.toFixed(3)} TND</strong></p>
            <p style="display: flex; justify-content: space-between; font-size: 18px; color: #dc2626; margin-top: 10px; padding-top: 10px; border-top: 2px solid #eee;">
              <span>Total:</span> <strong>${order.pricing.total.toFixed(3)} TND</strong>
            </p>
          </div>

          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Livraison estimée: ${new Date(order.shipping.estimatedDelivery).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    `;

    try {
      console.log('📧 [Email] Attempting to send to:', user.email);
      const data = await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: `Confirmation de commande ${order.orderNumber}`,
        html
      });
      console.log('📧 [Email] Order confirmation sent:', order.orderNumber, 'ID:', data.id);
    } catch (err) {
      console.error('📧 [Email] Failed:', err.message);
      console.error('📧 [Email] Error details:', JSON.stringify(err));
    }
  }

  async sendStatusUpdate(order, user) {
    if (!resend) {
      console.log('📧 [Email] Status update skipped - RESEND_API_KEY not configured');
      return;
    }
    
    const statusLabels = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En préparation',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée'
    };

    console.log('📧 [Email] Preparing status update email to:', user.email, 'for order:', order.orderNumber);
    
    try {
      const data = await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: `Mise à jour de votre commande ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background: #dc2626; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Tunisia Store</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #333;">Mise à jour de votre commande</h2>
              <p>Bonjour ${user.firstName || 'Client'},</p>
              <p>Votre commande <strong>${order.orderNumber}</strong> est maintenant: <strong style="color: #dc2626;">${statusLabels[order.status] || order.status}</strong></p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">Merci pour votre confiance!</p>
            </div>
          </div>
        `
      });
      console.log('📧 [Email] Status update sent:', order.orderNumber, order.status, 'Response:', JSON.stringify(data));
    } catch (err) {
      console.error('📧 [Email] Status update failed:', err.message);
      console.error('📧 [Email] Full error:', JSON.stringify(err));
    }
  }

  async sendVerificationEmail(user, token) {
    console.log('📧 [Email] Attempting to send verification email to:', user.email);
    
    if (!resend) {
      console.log('📧 [Email] Skipped - Resend not initialized');
      return;
    }
    
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.onrender.com'}/verify-email?token=${token}`;
    
    try {
      const data = await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: 'Vérifiez votre email - Tunisia Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Vérifiez votre email</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Merci de vérifier votre adresse email en cliquant sur le bouton ci-dessous:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Vérifier mon email
            </a>
            <p style="color: #6b7280; font-size: 12px;">Ce lien expire dans 24 heures.</p>
          </div>
        `
      });
      console.log('📧 [Email] Verification sent! ID:', data.id);
      console.log('📧 [Email] Verification email sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Verification FAILED:', err.message);
      console.error('📧 [Email] Full error:', err);
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!resend) {
      console.log('📧 [Email] Password reset skipped - RESEND_API_KEY not configured');
      return;
    }
    
    const resetUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.onrender.com'}/reset-password?token=${token}`;
    
    try {
      await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: 'Réinitialisation de mot de passe - Tunisia Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Réinitialiser votre mot de passe</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Réinitialiser mon mot de passe
            </a>
            <p style="color: #6b7280; font-size: 12px;">Ce lien expire dans 1 heure.</p>
          </div>
        `
      });
      console.log('📧 [Email] Password reset sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Password reset failed:', err.message);
    }
  }

  async sendContactNotification(contact) {
    if (!resend) return;
    
    try {
      await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL || 'adem.micro13@gmail.com',
        subject: `Nouveau message de ${contact.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Téléphone:</strong> ${contact.phone}</p>
            <p><strong>Message:</strong></p>
            <p>${contact.message}</p>
          </div>
        `
      });
      console.log('📧 [Email] Contact notification sent');
    } catch (err) {
      console.error('📧 [Email] Contact notification failed:', err.message);
    }
  }

  async sendNewsletterWelcome(email) {
    if (!resend) return;
    
    try {
      await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: email,
        subject: 'Bienvenue - Tunisia Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Bienvenue!</h2>
            <p>Merci de vous être inscrit à notre newsletter.</p>
            <p>Vous recevrez désormais nos dernières offres et promotions.</p>
          </div>
        `
      });
      console.log('📧 [Email] Newsletter welcome sent to:', email);
    } catch (err) {
      console.error('📧 [Email] Newsletter welcome failed:', err.message);
    }
  }

  async sendReturnStatusUpdate(returnRequest, order, user) {
    if (!resend) {
      console.log('📧 [Email] Return status update skipped - RESEND_API_KEY not configured');
      return;
    }
    
    const statusLabels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvée',
      REJECTED: 'Rejetée',
      PROCESSING: 'En traitement',
      COMPLETED: 'Terminée'
    };
    
    try {
      await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: `Mise à jour de votre demande de retour ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Mise à jour de votre demande de retour</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Votre demande de retour pour la commande <strong>${order.orderNumber}</strong> est maintenant: <strong>${statusLabels[returnRequest.status] || returnRequest.status}</strong></p>
            ${returnRequest.status === 'REJECTED' && returnRequest.adminNote ? `<p><strong>Raison:</strong> ${returnRequest.adminNote}</p>` : ''}
            <p style="color: #6b7280; font-size: 12px;">Merci pour votre confiance.</p>
          </div>
        `
      });
      console.log('📧 [Email] Return status update sent:', order.orderNumber, returnRequest.status);
    } catch (err) {
      console.error('📧 [Email] Return status update failed:', err.message);
    }
  }

  async sendNewPromoNotification(product, subscribers) {
    if (!resend) {
      console.log('📧 [Email] Promo notification skipped - Resend not initialized');
      return;
    }
    
    if (!subscribers || subscribers.length === 0) {
      console.log('📧 [Email] No subscribers to notify');
      return;
    }
    
    const discount = product.pricing?.originalPrice 
      ? Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100) 
      : 0;
    
    const imageUrl = product.media?.images?.[0] || 'https://placehold.co/400x400?text=Product';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background: #dc2626; color: white; padding: 15px; text-align: center;">
          <h1 style="margin: 0;">🛒 Nouvelle offre spéciale!</h1>
        </div>
        <div style="padding: 20px;">
          <img src="${imageUrl}" alt="${product.name}" style="max-width: 200px; border-radius: 8px; margin: 10px auto; display: block;">
          <h2 style="color: #333;">${product.name}</h2>
          <p style="font-size: 18px;">
            <span style="color: #dc2626; font-weight: bold;">${product.pricing?.price?.toFixed(3)} DT</span>
            ${product.pricing?.originalPrice ? `<span style="text-decoration: line-through; color: #999; margin-left: 10px;">${product.pricing.originalPrice.toFixed(3)} DT</span><span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; margin-left: 10px; font-size: 14px;">-${discount}%</span>` : ''}
          </p>
          <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.onrender.com'}/product/${product.slug}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; text-align: center; display: block;">Voir le produit</a>
          <p style="color: #6b7280; font-size: 12px;">Merci pour votre confiance!</p>
        </div>
      </div>
    `;
    
    // Send to all subscribers in batches
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const emails = batch.map(s => s.email).join(', ');
      
      try {
        await resend.emails.send({
          from: 'Tunisia Store <onboarding@resend.dev>',
          to: 'subscribers@tunisia-store.com', // Use BCC in production
          bcc: emails,
          subject: `🔥 Nouveau produit en promo: ${product.name} - ${discount}% de réduction!`,
          html
        });
        console.log(`📧 [Email] Promo notification sent to batch ${Math.floor(i/batchSize) + 1}`);
      } catch (err) {
        console.error('📧 [Email] Promo notification failed:', err.message);
      }
    }
  }
}

module.exports = new EmailService();