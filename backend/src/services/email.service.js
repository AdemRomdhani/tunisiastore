const nodemailer = require('nodemailer');
const { renderTemplate, buildHeader, buildFooter, buildItemsTable } = require('../templates/templateLoader');

let transporter;
let useSMTP = false;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  useSMTP = true;
  console.log('📧 [Email] SMTP transporter initialized:', process.env.SMTP_HOST);
} else {
  console.log('📧 [Email] SMTP not configured');
}

console.log('📧 [Email] ==========');
console.log('📧 [Email] SMTP configured:', useSMTP);
console.log('📧 [Email] ==========');

const BRAND = {
  name: 'Tunisia Store',
  email: 'contact@tunisiastore.tn',
  phone: '+216 70 000 000',
  website: 'https://tunisiastore.tn',
  address: 'Tunis, Tunisia',
  logoUrl: 'https://tunisiastore.tn/assets/logo.png',
  color: '#dc2626',
  accentColor: '#1e293b'
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tunisiastore.tn';

function buildShippingPrice(shipping) {
  if (shipping === 0) return 'Gratuite';
  return shipping.toFixed(2) + ' TND';
}

function buildDiscountRow(discount) {
  if (discount > 0) {
    return `<tr>
      <td style="color: #16a34a; padding: 6px 0;">Réduction (-)</td>
      <td style="text-align: right; font-weight: 600; color: #16a34a;">-${discount.toFixed(2)} TND</td>
    </tr>`;
  }
  return '';
}

function buildTimbreRow(timbre) {
  if (timbre > 0) {
    return `<tr>
      <td style="color: #64748b; padding: 6px 0;">Timbre</td>
      <td style="text-align: right; font-weight: 600; padding: 6px 0;">${timbre.toFixed(2)} TND</td>
    </tr>`;
  }
  return '';
}

function buildCartItemsRows(cartItems) {
  return cartItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">${(item.price || 0).toFixed(3)} TND</td>
      </tr>
    `).join('');
}

class EmailService {
  async sendOrderConfirmation(order, user) {
    if (!transporter) {
      console.log('📧 [Email] Skipped - No transporter');
      return;
    }

    const deliveryDate = order.shipping?.estimatedDelivery 
      ? new Date(order.shipping.estimatedDelivery).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : 'À confirmer';

    const html = renderTemplate('order-confirmation', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      itemsTable: buildItemsTable(order.items),
      subtotal: (order.pricing?.subtotal || 0).toFixed(2),
      shipping: buildShippingPrice(order.pricing?.shipping || 0),
      discountRow: buildDiscountRow(order.pricing?.discount || 0),
      ht: (order.pricing?.ht || 0).toFixed(2),
      tva: (order.pricing?.tva || 0).toFixed(2),
      timbreRow: buildTimbreRow(order.pricing?.timbre || 0),
      total: (order.pricing?.total || 0).toFixed(2),
      shippingFullName: order.shippingAddress?.fullName || 'Client',
      shippingAddress: order.shippingAddress?.address || '',
      shippingCity: order.shippingAddress?.city || '',
      shippingPostalCode: order.shippingAddress?.postalCode || '',
      deliveryDate,
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Commande confirmée #${order.orderNumber} - ${BRAND.name}`,
        html
      });
      console.log('📧 [Email] Order confirmation sent:', order.orderNumber, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Failed:', err.message);
    }
  }

  async sendStatusUpdate(order, user) {
    if (!transporter) {
      console.log('📧 [Email] Status update skipped - No transporter');
      return;
    }

    const statusInfo = {
      PENDING: { label: 'En attente', color: '#fef3c7', text: '#92400e' },
      CONFIRMED: { label: 'Confirmée', color: '#dbeafe', text: '#1e40af' },
      PROCESSING: { label: 'En préparation', color: '#e0e7ff', text: '#3730a3' },
      SHIPPED: { label: 'Expédiée', color: '#d1fae5', text: '#065f46' },
      DELIVERED: { label: 'Livrée', color: '#dcfce7', text: '#166534' },
      CANCELLED: { label: 'Annulée', color: '#fee2e2', text: '#991b1b' }
    };
    const status = statusInfo[order.status] || { label: order.status, color: '#f1f5f9', text: '#475569' };

    let trackingHtml = '';
    if (order.trackingNumber) {
      trackingHtml = `
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 15px;"><strong>Numéro de suivi :</strong> ${order.trackingNumber}</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 15px;"><strong>Transporteur :</strong> ${order.shippingCarrier || 'À confirmer'}</p>
      `;
    }

    const html = renderTemplate('order-status-update', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName || 'Client',
      orderNumber: order.orderNumber,
      statusColor: status.color,
      statusTextColor: status.text,
      statusLabel: status.label,
      trackingHtml,
      itemCount: order.items?.length || 0,
      total: (order.pricing?.total || 0).toFixed(3),
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Commande #${order.orderNumber} - ${status.label}`,
        html
      });
      console.log('📧 [Email] Status update sent:', order.orderNumber, order.status, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Status update failed:', err.message);
    }
  }

  async sendVerificationEmail(user, token) {
    if (!transporter) {
      console.log('📧 [Email] Skipped - No transporter');
      return;
    }

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    const html = renderTemplate('email-verification', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      verifyUrl
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: 'Vérifiez votre email - ' + BRAND.name,
        html
      });
      console.log('📧 [Email] Verification sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Verification FAILED:', err.message);
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!transporter) {
      console.log('📧 [Email] Skipped - No transporter');
      return;
    }

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const html = renderTemplate('password-reset', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      resetUrl
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: 'Réinitialiser votre mot de passe - ' + BRAND.name,
        html
      });
      console.log('📧 [Email] Password reset sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Password reset failed:', err.message);
    }
  }

  async sendContactNotification(contact) {
    if (!transporter) return;

    let subjectRow = '';
    if (contact.subject) {
      subjectRow = `<p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 10px;"><strong>Sujet :</strong> ${contact.subject}</p>`;
    }

    const html = renderTemplate('contact-notification', {
      contactName: contact.name,
      contactEmail: contact.email,
      contactPhone: contact.phone || 'Non fourni',
      subjectRow,
      contactMessage: contact.message
    });

    try {
      await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: process.env.ADMIN_EMAIL || 'adem.micro13@gmail.com',
        subject: `Nouveau message de ${contact.name} - ${BRAND.name}`,
        html
      });
      console.log('📧 [Email] Contact notification sent');
    } catch (err) {
      console.error('📧 [Email] Contact notification failed:', err.message);
    }
  }

  async sendContactConfirmation(contact) {
    if (!transporter) return;

    const html = renderTemplate('contact-confirmation', {
      header: buildHeader(),
      footer: buildFooter(),
      contactName: contact.name,
      contactSubject: contact.subject,
      contactMessage: contact.message,
      contactEmail: contact.email
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: contact.email,
        subject: 'Nous avons reçu votre message - ' + BRAND.name,
        html
      });
      console.log('📧 [Email] Contact confirmation sent to:', contact.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Contact confirmation failed:', err.message);
    }
  }

  async sendNewsletterWelcome(email) {
    if (!transporter) return;

    const html = renderTemplate('newsletter-welcome', {
      header: buildHeader(),
      footer: buildFooter(),
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: email,
        subject: 'Bienvenue sur ' + BRAND.name + ' !',
        html
      });
      console.log('📧 [Email] Newsletter welcome sent to:', email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Newsletter welcome failed:', err.message);
    }
  }

  async sendReturnStatusUpdate(returnRequest, order, user) {
    if (!transporter) {
      console.log('📧 [Email] Return status update skipped - No transporter');
      return;
    }

    const statusInfo = {
      PENDING: { label: 'En attente', color: '#fef3c7', text: '#92400e' },
      APPROVED: { label: 'Approuvée', color: '#d1fae5', text: '#065f46' },
      REJECTED: { label: 'Rejetée', color: '#fee2e2', text: '#991b1b' },
      PROCESSING: { label: 'En traitement', color: '#e0e7ff', text: '#3730a3' },
      COMPLETED: { label: 'Terminée', color: '#dcfce7', text: '#166534' }
    };
    const status = statusInfo[returnRequest.status] || { label: returnRequest.status, color: '#f1f5f9', text: '#475569' };

    let adminNoteHtml = '';
    if (returnRequest.adminNote) {
      adminNoteHtml = `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 10px;"><strong>Note de l'administrateur :</strong></p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">${returnRequest.adminNote}</p>
        </div>
      `;
    }

    const html = renderTemplate('return-status-update', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      orderNumber: order.orderNumber,
      statusColor: status.color,
      statusTextColor: status.text,
      statusLabel: status.label,
      adminNoteHtml,
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Retour commande #${order.orderNumber} - ${status.label}`,
        html
      });
      console.log('📧 [Email] Return status update sent:', order.orderNumber, returnRequest.status, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Return status update failed:', err.message);
    }
  }

  async sendNewPromoNotification(product, subscribers) {
    if (!transporter) {
      console.log('📧 [Email] Promo notification skipped - No transporter');
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
    const productUrl = `${FRONTEND_URL}/product/${product.slug}`;

    let originalPriceHtml = '';
    if (product.pricing?.originalPrice) {
      originalPriceHtml = `
        <span style="font-size: 18px; color: #94a3b8; text-decoration: line-through; margin-left: 10px;">${product.pricing.originalPrice.toFixed(3)} DT</span>
        <span style="display: inline-block; background: #dc2626; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-left: 10px;">-${discount}%</span>
      `;
    }

    const html = renderTemplate('promo-notification', {
      footer: buildFooter(),
      imageUrl,
      productName: product.name,
      productPrice: product.pricing?.price?.toFixed(3),
      originalPriceHtml,
      productDescription: product.shortDescription || 'Découvrez notre produit en promotion !',
      productUrl
    });

    for (const sub of subscribers) {
      try {
        await transporter.sendMail({
          from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
          to: sub.email,
          subject: `🔥 ${product.name} - ${discount}% de réduction !`,
          html
        });
      } catch (err) {
        console.error('📧 [Email] Promo failed to', sub.email, ':', err.message);
      }
    }
    console.log(`📧 [Email] Promo notification sent to ${subscribers.length} subscribers`);
  }

  async sendAbandonedCart(data) {
    if (!transporter) {
      console.log('📧 [Email] Abandoned cart skipped - No transporter');
      return;
    }

    const { user, cartItems, subtotal, cartUrl, reminderCount, hasDiscount } = data;

    let discountBanner = '';
    if (hasDiscount) {
      discountBanner = `
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">N'oubliez pas vos articles !</p>
          <p style="margin: 5px 0 0 0; color: #fecaca; font-size: 14px;">Nous vous offrons une remise exclusive sur ces produits</p>
        </div>
      `;
    }

    const html = renderTemplate('abandoned-cart', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      discountBanner,
      cartItemCount: cartItems.length,
      cartItemsRows: buildCartItemsRows(cartItems),
      subtotal: subtotal.toFixed(2),
      cartUrl
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Votre panier vous attend - ${BRAND.name}`,
        html
      });
      console.log('📧 [Email] Abandoned cart reminder sent:', user.email, info.messageId);
      return info;
    } catch (err) {
      console.error('📧 [Email] Abandoned cart failed:', err.message);
      throw err;
    }
  }

  async sendRefundConfirmation(order, user) {
    if (!transporter) {
      console.log('📧 [Email] Refund confirmation skipped - No transporter');
      return;
    }

    let refundReasonHtml = '';
    if (order.payment.refundReason) {
      refundReasonHtml = `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 5px;"><strong>Motif du remboursement :</strong></p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">${order.payment.refundReason}</p>
        </div>
      `;
    }

    const html = renderTemplate('refund-confirmation', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      orderNumber: order.orderNumber,
      refundAmount: (order.payment.refundAmount || 0).toFixed(3),
      refundReasonHtml,
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Remboursement commande #${order.orderNumber} - ${BRAND.name}`,
        html
      });
      console.log('📧 [Email] Refund confirmation sent:', order.orderNumber, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Refund confirmation failed:', err.message);
    }
  }

  async sendWelcomeEmail(user) {
    if (!transporter) {
      console.log('📧 [Email] Welcome email skipped - No transporter');
      return;
    }

    const html = renderTemplate('welcome', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: 'Bienvenue sur ' + BRAND.name + ' !',
        html
      });
      console.log('📧 [Email] Welcome email sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Welcome email failed:', err.message);
    }
  }

  async sendLoginConfirmation(user, clientIp, userAgent, isFirstLogin) {
    if (!transporter) {
      console.log('📧 [Email] Login confirmation skipped - No transporter');
      return;
    }

    let firstLoginMessage = '';
    if (isFirstLogin) {
      firstLoginMessage = `<p style="color: #475569; font-size: 15px; line-height: 1.6;">C'est votre première connexion. Bienvenue !</p>`;
    }

    const html = renderTemplate('login-confirmation', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName,
      loginDate: new Date().toLocaleString('fr-FR'),
      clientIp: clientIp || 'Inconnue',
      userAgent: userAgent || 'Inconnu',
      firstLoginMessage,
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: 'Nouvelle connexion - ' + BRAND.name,
        html
      });
      console.log('📧 [Email] Login confirmation sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Login confirmation failed:', err.message);
    }
  }

  async sendReturnConfirmation(returnRequest, order, user) {
    if (!transporter) {
      console.log('📧 [Email] Return confirmation skipped - No transporter');
      return;
    }

    const returnItemsHtml = returnRequest.items.map(item => `
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
          ${item.name} - Qté : ${item.quantity} - ${(item.price * item.quantity).toFixed(3)} TND
        </p>
      `).join('');

    const html = renderTemplate('return-confirmation', {
      header: buildHeader(),
      footer: buildFooter(),
      userFirstName: user.firstName || 'Client',
      orderNumber: order.orderNumber,
      returnRequestId: returnRequest._id?.toString().slice(-6) || 'N/A',
      returnDate: new Date(returnRequest.createdAt).toLocaleDateString('fr-FR'),
      returnItemsHtml,
      refundAmount: returnRequest.refundAmount.toFixed(3),
      frontendUrl: FRONTEND_URL
    });

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Demande de retour reçue - Commande #${order.orderNumber}`,
        html
      });
      console.log('📧 [Email] Return confirmation sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Return confirmation failed:', err.message);
    }
  }
}

module.exports = new EmailService();
