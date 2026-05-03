const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestEmail: String,
  
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    quantity: { type: Number, required: true },
    price: Number,
    reason: String
  }],
  
  type: {
    type: String,
    enum: ['RETURN', 'REFUND'],
    required: true
  },
  
  reason: {
    type: String,
    required: true,
    enum: [
      'DEFECTIVE_PRODUCT',
      'WRONG_ITEM',
      'NOT_AS_DESCRIBED',
      'CHANGED_MIND',
      'SIZE_ISSUE',
      'QUALITY_ISSUE',
      'OTHER'
    ]
  },
  
  description: {
    type: String,
    required: true
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  refundAmount: Number,
  refundMethod: {
    type: String,
    enum: ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'BANK_TRANSFER']
  },
  
  adminNotes: String,
  
  timeline: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  images: [String]
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);