const nodemailer = require('nodemailer');

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

const styles = {
  base: 'font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; margin: 0; padding: 0; width: 100%;',
  container: 'max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;',
  headerLogo: 'font-size: 28px; font-weight: bold; color: #ffffff; margin: 0;',
  headerTagline: 'color: #fecaca; font-size: 14px; margin-top: 8px;',
  content: 'background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;',
  footer: 'background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;',
  footerText: 'color: #94a3b8; font-size: 12px; margin: 5px 0;',
  h1: 'color: #1e293b; font-size: 24px; font-weight: 700; margin-bottom: 20px;',
  h2: 'color: #1e293b; font-size: 20px; font-weight: 600; margin-bottom: 15px;',
  p: 'color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 15px;',
  button: 'display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;',
  table: 'width: 100%; border-collapse: collapse; margin: 20px 0;',
  th: 'background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 2px solid #e2e8f0;',
  td: 'padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;',
  tdPrice: 'padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;',
  box: 'background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;',
  badge: 'display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;',
  divider: 'height: 1px; background: #e2e8f0; margin: 25px 0;'
};

function getHeader() {
  return `
    <div style="${styles.header}">
      <h1 style="${styles.headerLogo}">${BRAND.name}</h1>
      <p style="${styles.headerTagline}">Votre boutique de confiance pour l'électronique</p>
    </div>
  `;
}

function getFooter() {
  return `
    <div style="${styles.footer}">
      <p style="color: #ffffff; font-weight: 600; margin-bottom: 10px;">Suivez-nous</p>
      <p style="${styles.footerText}">
        <a href="${BRAND.website}" style="color: #ffffff; text-decoration: underline;">Site web</a> &nbsp;|&nbsp; 
        <a href="mailto:${BRAND.email}" style="color: #ffffff; text-decoration: underline;">Contact</a>
      </p>
      <p style="${styles.footerText}">${BRAND.phone}</p>
      <p style="${styles.footerText}">${BRAND.address}</p>
      <div style="${styles.divider}"></div>
      <p style="color: #64748b; font-size: 11px;">Ce message a été envoyé suite à une action sur votre compte Tunisia Store.</p>
    </div>
  `;
}

function getItemsTable(items) {
  return `
    <table style="${styles.table}">
      <thead>
        <tr>
          <th style="${styles.th}">Produit</th>
          <th style="${styles.th}; text-align: center;">Qté</th>
          <th style="${styles.th}; text-align: right;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td style="${styles.td}">${item.name || item.product?.name || 'Produit'}</td>
            <td style="${styles.td}; text-align: center;">${item.quantity}</td>
            <td style="${styles.tdPrice}">${(item.price || 0).toFixed(3)} TND</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function formatStatusBadge(status, label) {
  const colors = {
    PENDING: '#fef3c7; color: #92400e;',
    CONFIRMED: '#dbeafe; color: #1e40af;',
    PROCESSING: '#e0e7ff; color: #3730a3;',
    SHIPPED: '#d1fae5; color: #065f46;',
    DELIVERED: '#dcfce7; color: #166534;',
    CANCELLED: '#fee2e2; color: #991b1b;',
    APPROVED: '#d1fae5; color: #065f46;',
    REJECTED: '#fee2e2; color: #991b1b;'
  };
  const color = colors[status] || '#f1f5f9; color: #475569;';
  return `<span style="background: ${color} ${styles.badge}">${label}</span>`;
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commande confirmée - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Merci pour votre commande !</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Nous avons bien reçu votre commande. Voici le resumen :</p>
            
            <div style="${styles.box}">
              <p style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                Commande #${order.orderNumber}
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                Passée le ${new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            ${getItemsTable(order.items)}

            <div style="${styles.box}">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #64748b;">Sous-total HT</td>
                  <td style="text-align: right; font-weight: 600;">${(order.pricing?.subtotal || 0).toFixed(2)} TND</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">Livraison</td>
                  <td style="text-align: right; font-weight: 600;">${(order.pricing?.shipping || 0) === 0 ? 'Gratuite' : (order.pricing?.shipping || 0).toFixed(2) + ' TND'}</td>
                </tr>
                ${order.pricing?.discount > 0 ? `
                <tr>
                  <td style="color: #16a34a; padding: 6px 0;">Réduction (-)</td>
                  <td style="text-align: right; font-weight: 600; color: #16a34a;">-${order.pricing.discount.toFixed(2)} TND</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="color: #64748b; padding: 8px 0; border-top: 1px solid #e2e8f0; font-size: 13px;">Montant HT</td>
                  <td style="text-align: right; font-weight: 600; padding: 8px 0; border-top: 1px solid #e2e8f0; font-size: 13px;">${(order.pricing?.ht || 0).toFixed(2)} TND</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">TVA (19%)</td>
                  <td style="text-align: right; font-weight: 600; padding: 6px 0;">${(order.pricing?.tva || 0).toFixed(2)} TND</td>
                </tr>
                ${order.pricing?.timbre > 0 ? `
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">Timbre</td>
                  <td style="text-align: right; font-weight: 600; padding: 6px 0;">${order.pricing.timbre.toFixed(2)} TND</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 18px; font-weight: 700; color: #1e293b; padding-top: 15px;">Total TTC</td>
                  <td style="font-size: 18px; font-weight: 700; color: #dc2626; text-align: right; padding-top: 15px;">${(order.pricing?.total || 0).toFixed(2)} TND</td>
                </tr>
              </table>
            </div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Adresse de livraison :</strong></p>
              <p style="${styles.p}; margin: 0;">${order.shippingAddress?.fullName || 'Client'}</p>
              <p style="${styles.p}; margin: 0;">${order.shippingAddress?.address || ''}</p>
              <p style="${styles.p}; margin: 0;">${order.shippingAddress?.city || ''} ${order.shippingAddress?.postalCode || ''}</p>
              <p style="${styles.p}; margin: 10px 0 0 0;"><strong>Livraison estimée :</strong> ${deliveryDate}</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/orders" style="${styles.button}">
                Suivre ma commande
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Une question ? <a href="mailto:${BRAND.email}" style="color: #dc2626;">Contactez-nous</a>
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const trackingHtml = order.trackingNumber ? `
      <p style="${styles.p}"><strong>Numéro de suivi :</strong> ${order.trackingNumber}</p>
      <p style="${styles.p}"><strong>Transporteur :</strong> ${order.shippingCarrier || 'À confirmer'}</p>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mise à jour commande - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Mise à jour de votre commande</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName || 'Client'}</strong>,</p>
            <p style="${styles.p}">Votre commande <strong>#${order.orderNumber}</strong> a été mise à jour.</p>
            
            <div style="text-align: center; padding: 25px; background: ${status.color}; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: ${status.text}; text-transform: uppercase; letter-spacing: 1px;">Statut</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: ${status.text};">${status.label}</p>
            </div>

            ${trackingHtml}

            <div style="${styles.divider}"></div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Récapitulatif :</strong></p>
              <p style="${styles.p}; margin: 0;">${order.items?.length || 0} produit(s)</p>
              <p style="${styles.p}; margin: 5px 0 0 0;"><strong>Total :</strong> <span style="color: #dc2626; font-weight: 700;">${(order.pricing?.total || 0).toFixed(3)} TND</span></p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/orders/${order.orderNumber}" style="${styles.button}">
                Voir les détails
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Merci pour votre confiance !
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const verifyUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérifiez votre email - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Vérifiez votre adresse email</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Merci de vous être inscrit sur <strong>${BRAND.name}</strong>.</p>
            <p style="${styles.p}">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="${styles.button}">
                Vérifier mon email
              </a>
            </div>

            <p style="${styles.p}; color: #64748b; font-size: 13px;">
              Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorez cet email.
            </p>

            <div style="${styles.divider}"></div>

            <p style="${styles.p}; text-align: center;">
              <a href="${BRAND.website}" style="${styles.p}; color: #dc2626;">${BRAND.website}</a>
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const resetUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialiser mot de passe - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Réinitialiser votre mot de passe</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p style="${styles.p}">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="${styles.button}">
                Réinitialiser mon mot de passe
              </a>
            </div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Important :</strong></p>
              <ul style="${styles.p}; margin: 0; padding-left: 20px;">
                <li>Ce lien expire dans 1 heure</li>
                <li>Ne partagez pas ce lien avec quelqu'un d'autre</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              </ul>
            </div>

            <div style="${styles.divider}"></div>
            <p style="${styles.p}; text-align: center; color: #64748b;">
              ${BRAND.name} - Votre sécurité est notre priorité
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau message - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${BRAND.name}</h1>
          </div>
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Nouveau message de contact</h1>
            
            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Nom :</strong> ${contact.name}</p>
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Email :</strong> <a href="mailto:${contact.email}" style="color: #dc2626;">${contact.email}</a></p>
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Téléphone :</strong> ${contact.phone || 'Non fourni'}</p>
              ${contact.subject ? `<p style="${styles.p}; margin-bottom: 10px;"><strong>Sujet :</strong> ${contact.subject}</p>` : ''}
            </div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Message :</strong></p>
              <p style="${styles.p}; margin: 0; white-space: pre-wrap;">${contact.message}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message reçu - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Nous avons reçu votre message !</h1>
            <p style="${styles.p}">Bonjour <strong>${contact.name}</strong>,</p>
            <p style="${styles.p}">Merci de nous avoir contactés. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
            
            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 10px;"><strong>Sujet :</strong> ${contact.subject}</p>
              <p style="${styles.p}; margin: 0;"><strong>Message :</strong></p>
              <p style="${styles.p}; margin: 10px 0 0 0; white-space: pre-wrap;">${contact.message}</p>
            </div>

            <p style="${styles.p}">Notre équipe vous contactera bientôt à l'adresse <strong>${contact.email}</strong>.</p>

            <div style="${styles.divider}"></div>

            <p style="${styles.p}; text-align: center;">
              <a href="${BRAND.website}" style="${styles.button}">
                Découvrir nos produits
              </a>
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Bienvenue sur ${BRAND.name} !</h1>
            <p style="${styles.p}">Merci de vous être inscrit à notre newsletter.</p>
            <p style="${styles.p}">Vous recevrez désormais nos dernières offres, promotions et nouvelles.</p>

            <div style="${styles.divider}"></div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}" style="${styles.button}">
                Découvrir nos produits
              </a>
            </div>

            <div style="${styles.divider}"></div>

            <p style="${styles.p}; text-align: center; font-size: 13px; color: #64748b;">
              Vous pouvez vous désabonner à tout moment.
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const noteHtml = returnRequest.adminNote ? `
      <div style="${styles.box}">
        <p style="${styles.p}; margin-bottom: 10px;"><strong>Note de l'administrateur :</strong></p>
        <p style="${styles.p}; margin: 0;">${returnRequest.adminNote}</p>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mise à jour retour - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Mise à jour de votre demande de retour</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Votre demande de retour pour la commande <strong>#${order.orderNumber}</strong> a été mise à jour.</p>
            
            <div style="text-align: center; padding: 25px; background: ${status.color}; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: ${status.text}; text-transform: uppercase; letter-spacing: 1px;">Statut</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: ${status.text};">${status.label}</p>
            </div>

            ${noteHtml}

            <div style="${styles.divider}"></div>

            <p style="${styles.p}">Nous traitons votre demande dans les plus brefs délais.</p>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/returns" style="${styles.button}">
                Voir mes retours
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Une question ? <a href="mailto:${BRAND.email}" style="color: #dc2626;">Contactez-nous</a>
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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
    const productUrl = `${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/product/${product.slug}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle offre - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="color: #ffffff; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Offre spéciale</p>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">🔥 Nouveauita !</h1>
          </div>
          <div style="${styles.content}">
            <img src="${imageUrl}" alt="${product.name}" style="max-width: 250px; border-radius: 8px; margin: 0 auto; display: block;">
            
            <h2 style="${styles.h1}; text-align: center; margin-top: 20px;">${product.name}</h2>
            
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #dc2626;">${product.pricing?.price?.toFixed(3)} DT</span>
              ${product.pricing?.originalPrice ? `
                <span style="font-size: 18px; color: #94a3b8; text-decoration: line-through; margin-left: 10px;">${product.pricing.originalPrice.toFixed(3)} DT</span>
                <span style="display: inline-block; background: #dc2626; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-left: 10px;">-${discount}%</span>
              ` : ''}
            </div>

            <p style="${styles.p}; text-align: center;">
              ${product.shortDescription || 'Découvrez notre produit en promotion !'}
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${productUrl}" style="${styles.button}">
                Voir le produit
              </a>
            </div>

            <div style="${styles.divider}"></div>

            <p style="${styles.p}; text-align: center; font-size: 13px; color: #64748b;">
              Offre limitée dans le temps. Ne manquez pas cette opportunité !
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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
    
    const itemsHtml = cartItems.map(item => `
      <tr>
        <td style="${styles.td}">${item.name}</td>
        <td style="${styles.td}; text-align: center;">${item.quantity}</td>
        <td style="${styles.tdPrice}">${(item.price || 0).toFixed(3)} TND</td>
      </tr>
    `).join('');

    const discountBanner = hasDiscount ? `
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">N'oubliez pas vos articles !</p>
        <p style="margin: 5px 0 0 0; color: #fecaca; font-size: 14px;">Nous vous offrons une remise exclusive sur ces produits</p>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre panier vous attend - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Votre panier vous attend !</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Vous avez laissé des articles dans votre panier. Ne perdez pas cette opportunité !</p>

            ${discountBanner}

            <div style="${styles.box}">
              <p style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                Articles dans votre panier (${cartItems.length}):
              </p>
              <table style="${styles.table}">
                <thead>
                  <tr>
                    <th style="${styles.th}">Produit</th>
                    <th style="${styles.th}; text-align: center;">Qté</th>
                    <th style="${styles.th}; text-align: right;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div style="${styles.box}">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #64748b; font-size: 16px; font-weight: 600;">Sous-total</td>
                  <td style="text-align: right; font-size: 20px; font-weight: 700; color: #dc2626;">${subtotal.toFixed(2)} TND</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${cartUrl}" style="${styles.button}">
                Compléter ma commande
              </a>
            </div>

            <p style="${styles.p}; margin-top: 20px; text-align: center; color: #64748b; font-size: 13px;">
              Ces articles pourraient être en rupture de stock bientôt. Ne perdez pas cette opportunité !
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Remboursement confirmé - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Remboursement confirmé</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Nous avons traité votre demande de remboursement pour la commande <strong>#${order.orderNumber}</strong>.</p>
            
            <div style="${styles.box}">
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #1e293b;">
                Montant remboursé: ${(order.payment.refundAmount || 0).toFixed(3)} TND
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                Le remboursement sera crédité sur votre compte dans un délai de 5 à 10 jours ouvrables.
              </p>
            </div>

            ${order.payment.refundReason ? `
            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Motif du remboursement :</strong></p>
              <p style="${styles.p}; margin: 0;">${order.payment.refundReason}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/orders/${order.orderNumber}" style="${styles.button}">
                Voir les détails
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Pour toute question, n'hésitez pas à nous contacter.
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Bienvenue sur ${BRAND.name} !</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Votre email a été vérifié avec succès. Votre compte est maintenant actif.</p>
            
            <div style="${styles.box}">
              <p style="${styles.p}; margin: 0;">Vous pouvez maintenant :</p>
              <ul style="${styles.p}; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Passer des commandes</li>
                <li>Suivre vos commandes</li>
                <li>Gérer vos retours</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}" style="${styles.button}">
                Commencer mes achats
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Merci de votre confiance !
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle connexion - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Nouvelle connexion détectée</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName}</strong>,</p>
            <p style="${styles.p}">Une nouvelle connexion à votre compte a été détectée.</p>
            
            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Détails :</strong></p>
              <p style="${styles.p}; margin: 0;"><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              <p style="${styles.p}; margin: 0;"><strong>IP :</strong> ${clientIp || 'Inconnue'}</p>
              <p style="${styles.p}; margin: 0;"><strong>Navigateur :</strong> ${userAgent || 'Inconnu'}</p>
            </div>

            ${isFirstLogin ? `<p style="${styles.p}">C'est votre premi re connexion. Bienvenue !</p>` : ''}

            <p style="${styles.p}; color: #dc2626; font-weight: 600;">
              Si ce n'est pas vous, veuillez changer votre mot de passe imm diatement.
            </p>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/account/security" style="${styles.button}">
                S curiser mon compte
              </a>
            </div>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande de retour re ue - ${BRAND.name}</title>
      </head>
      <body style="${styles.base}">
        <div style="${styles.container}">
          ${getHeader()}
          <div style="${styles.content}">
            <h1 style="${styles.h1}">Demande de retour re ue</h1>
            <p style="${styles.p}">Bonjour <strong>${user.firstName || 'Client'}</strong>,</p>
            <p style="${styles.p}">Nous avons bien re u votre demande de retour pour la commande <strong>#${order.orderNumber}</strong>.</p>
            
            <div style="${styles.box}">
              <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #1e293b;">
                Num ro de demande : #${returnRequest._id?.toString().slice(-6) || 'N/A'}
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                Date de la demande : ${new Date(returnRequest.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Articles concern s :</strong></p>
              ${returnRequest.items.map(item => `
                <p style="${styles.p}; margin: 0;">
                  ${item.name} - Qt : ${item.quantity} - ${(item.price * item.quantity).toFixed(3)} TND
                </p>
              `).join('')}
            </div>

            <div style="${styles.box}">
              <p style="${styles.p}; margin-bottom: 5px;"><strong>Montant du remboursement :</strong></p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #dc2626;">
                ${returnRequest.refundAmount.toFixed(3)} TND
              </p>
            </div>

            <p style="${styles.p}">Notre quipe va examiner votre demande et vous contactera dans les plus brefs d lais.</p>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'https://tunisiastore.tn'}/returns" style="${styles.button}">
                Suivre ma demande
              </a>
            </div>

            <p style="${styles.p}; margin-top: 25px; text-align: center;">
              Une question ? <a href="mailto:${BRAND.email}" style="color: #dc2626;">Contactez-nous</a>
            </p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: useSMTP ? process.env.SMTP_USER : `${BRAND.name} <${BRAND.email}>`,
        to: user.email,
        subject: `Demande de retour re ue - Commande #${order.orderNumber}`,
        html
      });
      console.log('📧 [Email] Return confirmation sent:', user.email, info.messageId);
    } catch (err) {
      console.error('📧 [Email] Return confirmation failed:', err.message);
    }
  }
}

module.exports = new EmailService();