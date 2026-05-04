const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📧 [Email] Resend initialized:', !!process.env.RESEND_API_KEY);

class EmailService {
  async sendOrderConfirmation(order, user) {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [Email] Skipped - RESEND_API_KEY not configured');
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
      const data = await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: `Confirmation de commande ${order.orderNumber}`,
        html
      });
      console.log('📧 [Email] Order confirmation sent:', order.orderNumber, data.id);
    } catch (err) {
      console.error('📧 [Email] Failed:', err.message);
    }
  }

  async sendStatusUpdate(order, user) {
    if (!process.env.RESEND_API_KEY) {
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

    try {
      await resend.emails.send({
        from: 'Tunisia Store <onboarding@resend.dev>',
        to: user.email,
        subject: `Mise à jour de votre commande ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Statut mis à jour</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Votre commande <strong>${order.orderNumber}</strong> est maintenant: <strong>${statusLabels[order.status] || order.status}</strong></p>
          </div>
        `
      });
      console.log('📧 [Email] Status update sent:', order.orderNumber, order.status);
    } catch (err) {
      console.error('📧 [Email] Status update failed:', err.message);
    }
  }

  async sendVerificationEmail(user, token) {
    console.log('📧 [Email] Attempting to send verification email to:', user.email);
    console.log('📧 RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [Email] Skipped - RESEND_API_KEY not configured');
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
    if (!process.env.RESEND_API_KEY) {
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
    if (!process.env.RESEND_API_KEY) return;
    
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
    if (!process.env.RESEND_API_KEY) return;
    
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
}

module.exports = new EmailService();