const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestEmail: String,
  guestPhone: String,
  
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    image: String,
    price: Number,
    quantity: Number,
    selectedAttributes: [{ name: String, value: String }],
    subtotal: Number
  }],
  
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    governorate: { 
      type: String, 
      required: true,
      enum: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
             'Bizerte', 'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
             'Monastir', 'Mahdia', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
             'Gabes', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili']
    },
    city: { type: String, required: true },
    streetAddress: { type: String, required: true },
    postalCode: String,
    additionalInfo: String
  },
  
  billingAddress: {
    sameAsShipping: { type: Boolean, default: true },
    fullName: String,
    phone: String,
    governorate: String,
    city: String,
    streetAddress: String,
    postalCode: String
  },
  
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    ht: { type: Number, default: 0 },
    tva: { type: Number, default: 0 },
    timbre: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  payment: {
    method: { 
      type: String, 
      required: true,
      enum: ['CASH_ON_DELIVERY', 'CARD_ONLINE', 'D17', 'FLOUSSI', 'BANK_TRANSFER', 'EDINAR']
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING'
    },
    transactionId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  
  shipping: {
    carrier: { type: String, enum: ['INTERNAL', 'ARAMEX', 'AMANA', 'POSTE'] },
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cost: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  statusHistory: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  notes: {
    customer: String,
    internal: String
  },

  internalNotes: [{
    text: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);