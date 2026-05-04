const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true,
  logger: true,
  connectionTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

console.log('📧 [Email] Transporter created with:', { user: process.env.SMTP_USER, port: 465, secure: true });

transporter.verify(function(error, success) {
  if (error) {
    console.log('📧 [Email] SMTP connection FAILED:', error.message);
    console.log('📧 [Email] Full error:', error);
  } else {
    console.log('📧 [Email] SMTP connection OK');
  }
});

class EmailService {
  async sendOrderConfirmation(order, user) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Skipped - SMTP not configured');
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
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Confirmation de commande ${order.orderNumber}`,
        html
      });
      console.log('📧 [Email] Order confirmation sent:', order.orderNumber);
    } catch (err) {
      console.error('📧 [Email] Failed:', err.message);
    }
  }

  async sendStatusUpdate(order, user) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Status update skipped - SMTP not configured');
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
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
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
    console.log('📧 SMTP_USER set:', !!process.env.SMTP_USER);
    console.log('📧 SMTP_PASS length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 [Email] Skipped - SMTP not configured');
      return;
    }
    
    console.log('📧 [Email] SMTP config:', process.env.SMTP_USER, 'PASS length:', process.env.SMTP_PASS?.length);
    console.log('📧 [Email] Sending verification email to:', user.email);
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=${token}`;
    
    try {
      const info = await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
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
      console.log('📧 [Email] Verification sent! MessageId:', info.messageId);
      console.log('📧 [Email] Verification email sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Verification FAILED:', err.message);
      console.error('📧 [Email] Full error:', err);
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Password reset skipped - SMTP not configured');
      return;
    }
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${token}`;
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Réinitialisation du mot de passe - Tunisia Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Réinitialisation du mot de passe</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Réinitialiser mon mot de passe
            </a>
            <p style="color: #6b7280; font-size: 12px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          </div>
        `
      });
      console.log('📧 [Email] Password reset email sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Password reset failed:', err.message);
    }
  }

  async sendWelcomeEmail(user) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Welcome email skipped - SMTP not configured');
      return;
    }
    
    console.log('📧 [Email] Sending welcome email to:', user.email);
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Bienvenue sur Tunisia Store ! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>Tunisia Store</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #22c55e;">Bienvenue ${user.firstName} !</h2>
              <p>Votre compte a été vérifié avec succès.</p>
              <p>Merci de rejoindre Tunisia Store - votre boutique en ligne de confiance en Tunisie.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Vous pouvez maintenant:</h3>
                <ul style="padding-left: 20px;">
                  <li>Commander vos produits préférés</li>
                  <li>Suivre vos commandes en temps réel</li>
                  <li>Gérer vos adresses de livraison</li>
                  <li>Consulter l'historique de vos commandes</li>
                  <li>Demander des retours facilement</li>
                </ul>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                Découvrir nos produits
              </a>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                L'équipe Tunisia Store<br>
                📧 contact@tunisiastore.tn
              </p>
            </div>
          </div>
        `
      });
      console.log('📧 [Email] Welcome email sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Welcome failed:', err.message);
    }
  }

  async sendLoginConfirmation(user, ipAddress, userAgent, isFirstLogin) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Login confirmation skipped - SMTP not configured');
      return;
    }
    
    console.log('📧 [Email] Sending login confirmation to:', user.email, 'First login:', isFirstLogin);
    
    const device = userAgent || 'App/Web';
    const time = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' });
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: isFirstLogin ? 'Première connexion détectée 🔐' : 'Nouvelle connexion détectée 🔐',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #22c55e;">${isFirstLogin ? 'Bienvenue sur Tunisia Store !' : 'Nouvelle connexion'}</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>${isFirstLogin ? 'Bienvenue ! C\'est votre première connexion.' : 'Une nouvelle connexion a été détectée sur votre compte.'}</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Informations de connexion:</h3>
              <p><strong>Date:</strong> ${time}</p>
              <p><strong>Appareil:</strong> ${device}</p>
              <p><strong>Adresse IP:</strong> ${ipAddress || 'Inconnue'}</p>
            </div>
            
            <p style="color: #6b7280;">Si c'était vous, aucune action n'est nécessaire.</p>
            <p style="color: #dc2626;">Si vous ne reconnaissez pas cette connexion, contactez-nous immédiatement.</p>
          </div>
        `
      });
      console.log('📧 [Email] Login confirmation sent:', user.email);
    } catch (err) {
      console.error('📧 [Email] Login confirmation failed:', err.message);
    }
  }

  async sendContactConfirmation(contact) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Contact confirmation skipped - SMTP not configured');
      return;
    }
    
    console.log('📧 [Email] Sending contact confirmation to:', contact.email);
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: 'Message reçu - Tunisia Store',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>Tunisia Store</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #22c55e;">Message reçu !</h2>
              <p>Bonjour ${contact.name},</p>
              <p>Nous avons bien reçu votre message.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Sujet: ${contact.subject}</h3>
                <p><strong>Message:</strong></p>
                <p style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${contact.message}</p>
              </div>
              
              <p>Notre équipe vous répondra dans les plus brefs délais (24-48h).</p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                L'équipe Tunisia Store<br>
                📧 contact@tunisiastore.tn
              </p>
            </div>
          </div>
        `
      });
      console.log('📧 [Email] Contact confirmation sent:', contact.email);
    } catch (err) {
      console.error('📧 [Email] Contact confirmation failed:', err.message);
    }
  }

  async sendReturnConfirmation(returnRequest, order, user) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Return confirmation skipped - SMTP not configured');
      return;
    }
    
    const userEmail = user?.email || returnRequest.guestEmail;
    console.log('📧 [Email] Sending return confirmation to:', userEmail);
    
    const statusLabels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
      REFUNDED: 'Remboursé'
    };
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Demande de retour #${order.orderNumber} - Tunisia Store`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>Tunisia Store</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #22c55e;">Demande de retour enregistrée</h2>
              <p>Bonjour ${user?.firstName || 'Client'},</p>
              <p>Votre demande de retour a été enregistrée.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails:</h3>
                <p><strong>Commande:</strong> ${order.orderNumber}</p>
                <p><strong>Type:</strong> ${returnRequest.type === 'REFUND' ? 'Remboursement' : 'Échange'}</p>
                <p><strong>Motif:</strong> ${returnRequest.reason}</p>
                <p><strong>Statut:</strong> <span style="color: #f59e0b;">${statusLabels[returnRequest.status] || returnRequest.status}</span></p>
              </div>
              
              <p>Nous traiterons votre demande sous 48-72 heures.</p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                L'équipe Tunisia Store<br>
                📧 contact@tunisiastore.tn
              </p>
            </div>
          </div>
        `
      });
      console.log('📧 [Email] Return confirmation sent:', userEmail);
    } catch (err) {
      console.error('📧 [Email] Return confirmation failed:', err.message);
    }
  }

  async sendReturnStatusUpdate(returnRequest, order, user, status, adminNotes) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS.length < 5) {
      console.log('📧 [Email] Return status update skipped - SMTP not configured');
      return;
    }
    
    const userEmail = user?.email || returnRequest.guestEmail;
    console.log('📧 [Email] Sending return status update to:', userEmail, 'Status:', status);
    
    const statusLabels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
      REFUNDED: 'Remboursé'
    };
    
    const statusColors = {
      PENDING: '#f59e0b',
      APPROVED: '#22c55e',
      REJECTED: '#dc2626',
      REFUNDED: '#22c55e'
    };
    
    try {
      await transporter.sendMail({
        from: `"Tunisia Store" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Mise à jour retour #${order.orderNumber} - ${statusLabels[status] || status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>Tunisia Store</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: ${statusColors[status] || '#22c55e'};">Statut mis à jour</h2>
              <p>Bonjour ${user?.firstName || 'Client'},</p>
              <p>Le statut de votre demande de retour a été mis à jour.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Commande:</strong> ${order.orderNumber}</p>
                <p><strong>Nouveau statut:</strong> <span style="color: ${statusColors[status] || '#22c55e'}; font-weight: bold;">${statusLabels[status] || status}</span></p>
                ${adminNotes ? `<p><strong>Note de l'administration:</strong></p><p style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${adminNotes}</p>` : ''}
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                L'équipe Tunisia Store<br>
                📧 contact@tunisiastore.tn
              </p>
            </div>
          </div>
        `
      });
      console.log('📧 [Email] Return status update sent:', userEmail);
    } catch (err) {
      console.error('📧 [Email] Return status update failed:', err.message);
    }
  }
}

module.exports = new EmailService();