const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BRAND = {
  name: 'Tunisia Store',
  address: 'Tunis, Tunisia',
  phone: '+216 70 000 000',
  email: 'contact@tunisiastore.tn',
  website: 'https://tunisiastore.tn',
  taxId: process.env.TAX_ID || '1234567',
  rib: process.env.BANK_IBAN || 'TN12 1234 5678 9012 3456 7890'
};

class InvoiceService {

  /**
   * Generate invoice number
   */
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  /**
   * Generate fiscal QR code data
   */
  async generateQRData(order) {
    const qrData = {
      nif: BRAND.taxId,
      tin: BRAND.taxId,
      invoiceNumber: order.invoiceNumber || order.orderNumber,
      date: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      total: order.pricing.total.toFixed(3),
      tax: order.pricing.tva ? order.pricing.tva.toFixed(3) : '0.000',
      paymentMethod: order.payment.method,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(3),
        total: item.subtotal.toFixed(3)
      }))
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate PDF invoice
   */
  async generateInvoice(order, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const invoiceNumber = options.invoiceNumber || this.generateInvoiceNumber();
        const invoiceDate = order.createdAt ? new Date(order.createdAt) : new Date();
        
        // Generate QR code
        const qrData = await this.generateQRData(order);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 100,
          margin: 1
        });

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Facture ${invoiceNumber}`,
            Author: BRAND.name,
            Subject: `Invoice ${invoiceNumber}`
          }
        });

        // Build chunks for response
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        
        doc.on('end', async () => {
          const pdfBuffer = Buffer.concat(chunks);
          
          // Save to file if path provided
          if (options.outputPath) {
            const dir = path.dirname(options.outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(options.outputPath, pdfBuffer);
            console.log(`📄 Invoice saved: ${options.outputPath}`);
          }
          
          resolve({
            success: true,
            invoiceNumber,
            pdfBuffer,
            qrData
          });
        });

        // ===== PDF CONTENT =====

        // Header
        doc.fontSize(20).fillColor('#dc2626').font('Helvetica-Bold').text(BRAND.name, 50, 50);
        doc.fontSize(10).fillColor('#666').font('Helvetica')
          .text(BRAND.address, 50, 75)
          .text(`Tel: ${BRAND.phone}`, 50, 90)
          .text(`Email: ${BRAND.email}`, 50, 105)
          .text(`Website: ${BRAND.website}`, 50, 120);

        // Invoice title
        doc.fontSize(16).fillColor('#1e293b').font('Helvetica-Bold')
          .text('FACTURE / INVOICE', 400, 50, { align: 'right' });
        
        doc.fontSize(10).fillColor('#666').font('Helvetica')
          .text(`N°: ${invoiceNumber}`, 400, 75, { align: 'right' })
          .text(`Date: ${invoiceDate.toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' })
          .text(`Commande: ${order.orderNumber}`, 400, 105, { align: 'right' });

        // Divider
        doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#e2e8f0').stroke();

        // Customer info
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('Client / Customer', 50, 170);
        
        const customerName = order.shippingAddress?.fullName || order.user?.firstName + ' ' + order.user?.lastName || 'Client';
        const customerAddress = [
          order.shippingAddress?.streetAddress,
          order.shippingAddress?.city,
          order.shippingAddress?.governorate,
          order.shippingAddress?.postalCode
        ].filter(Boolean).join(', ');

        doc.fontSize(10).fillColor('#475569').font('Helvetica')
          .text(customerName, 50, 195)
          .text(customerAddress, 50, 210)
          .text(`Tel: ${order.shippingAddress?.phone || order.user?.phone || 'N/A'}`, 50, 225);

        // Payment info
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('Paiement / Payment', 350, 170);
        
        const paymentStatus = order.payment?.status || 'PENDING';
        const paymentStatusColors = {
          PENDING: '#f59e0b',
          COMPLETED: '#10b981',
          FAILED: '#ef4444',
          REFUNDED: '#6366f1'
        };
        
        doc.fontSize(10).fillColor('#475569').font('Helvetica')
          .text(`Mode: ${this.getPaymentMethodLabel(order.payment?.method)}`, 350, 195)
          .text(`Statut: ${paymentStatus}`, 350, 210);

        // Items table
        const tableTop = 270;
        doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold');
        
        // Table header
        doc.text('Réf/SKU', 50, tableTop)
          .text('Produit/Product', 120, tableTop)
          .text('Qté/Qty', 350, tableTop, { width: 50, align: 'center' })
          .text('Prix/Price', 400, tableTop, { width: 70, align: 'right' })
          .text('Total', 470, tableTop, { width: 75, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#e2e8f0').stroke();

        // Table rows
        let y = tableTop + 25;
        doc.font('Helvetica').fontSize(9);
        
        for (const item of order.items || []) {
          if (y > 500) {
            doc.addPage();
            y = 50;
          }
          
          const sku = item.sku || item.product?.toString().substring(0, 8) || '-';
          const name = item.name?.substring(0, 40) || 'Product';
          const qty = item.quantity || 0;
          const price = (item.price || 0).toFixed(3);
          const total = (item.subtotal || 0).toFixed(3);
          
          doc.text(sku, 50, y, { width: 70 })
            .text(name, 120, y, { width: 230 })
            .text(qty.toString(), 350, y, { width: 50, align: 'center' })
            .text(`${price} DT`, 400, y, { width: 70, align: 'right' })
            .text(`${total} DT`, 470, y, { width: 75, align: 'right' });
          
          y += 20;
        }

        // Totals
        y += 20;
        doc.moveTo(300, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
        y += 15;

        const subtotal = (order.pricing.subtotal || 0).toFixed(3);
        const shipping = (order.pricing.shipping || 0).toFixed(3);
        const discount = (order.pricing.discount || 0).toFixed(3);
        const ht = (order.pricing.ht || order.pricing.subtotal || 0).toFixed(3);
        const tva = (order.pricing.tva || 0).toFixed(3);
        const timbre = (order.pricing.timbre || 0).toFixed(3);
        const total = (order.pricing.total || 0).toFixed(3);

        doc.font('Helvetica').fontSize(10)
          .text('Sous-total / Subtotal:', 350, y)
          .text(`${subtotal} DT`, 470, y, { width: 75, align: 'right' });
        
        if (order.pricing.discount > 0) {
          y += 15;
          doc.fillColor('#10b981').text('Réduction / Discount:', 350, y)
            .text(`-${discount} DT`, 470, y, { width: 75, align: 'right' });
        }
        
        if (order.pricing.shipping > 0) {
          y += 15;
          doc.fillColor('#475569').text('Livraison / Shipping:', 350, y)
            .text(`${shipping} DT`, 470, y, { width: 75, align: 'right' });
        }
        
        y += 15;
        doc.text('HT:', 350, y).text(`${ht} DT`, 470, y, { width: 75, align: 'right' });
        
        y += 15;
        doc.text('TVA (19%):', 350, y).text(`${tva} DT`, 470, y, { width: 75, align: 'right' });
        
        if (order.pricing.timbre > 0) {
          y += 15;
          doc.text('Timbre:', 350, y).text(`${timbre} DT`, 470, y, { width: 75, align: 'right' });
        }
        
        y += 20;
        doc.moveTo(300, y).lineTo(545, y).strokeColor('#dc2626').stroke();
        y += 10;
        
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#dc2626')
          .text('TOTAL TTC:', 350, y)
          .text(`${total} DT`, 470, y, { width: 75, align: 'right' });

        // QR Code
        if (qrCodeDataUrl) {
          const qrBuffer = Buffer.from(qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(qrBuffer, 50, y + 30, { width: 80, height: 80 });
          
          doc.fontSize(8).fillColor('#666').font('Helvetica')
            .text('Code QR Fiscal', 50, y + 115, { width: 80, align: 'center' });
        }

        // Footer
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
          .text('Merci pour votre confiance / Thank you for your business', 50, 700, { align: 'center' })
          .text(`Générée le ${new Date().toLocaleString('fr-FR')} - ${BRAND.name}`, 50, 715, { align: 'center' });

        // Add tax footer
        doc.fontSize(8).fillColor('#64748b')
          .text(`Identifiant Fiscal: ${BRAND.taxId} | RIB: ${BRAND.rib}`, 50, 730, { align: 'center' });

        doc.end();

      } catch (error) {
        console.error('📄 Invoice generation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Get payment method label in French
   */
  getPaymentMethodLabel(method) {
    const labels = {
      'CASH_ON_DELIVERY': 'Paiement à la livraison',
      'CARD_ONLINE': 'Carte bancaire en ligne',
      'D17': 'Paiement en 17 fois',
      'FLOUSSI': 'Floussi',
      'BANK_TRANSFER': 'Virement bancaire',
      'EDINAR': 'E-Dinar',
      'STRIPE': 'Carte bancaire (Stripe)'
    };
    return labels[method] || method;
  }

  /**
   * Generate and save invoice to file
   */
  async saveInvoice(order, outputDir) {
    const filename = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir || './invoices', filename);
    
    return await this.generateInvoice(order, {
      outputPath,
      invoiceNumber: `INV-${order.orderNumber}`
    });
  }
}

module.exports = new InvoiceService();