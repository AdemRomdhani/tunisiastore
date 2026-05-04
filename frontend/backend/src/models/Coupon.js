const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'],
    required: true
  },
  
  value: { type: Number, required: true, min: 0 },
  
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: Number,
  
  usage: {
    totalLimit: Number,
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  isActive: { type: Boolean, default: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

couponSchema.methods.isValid = function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.validFrom || now > this.validUntil) return false;
  if (this.usage.totalLimit && this.usage.usedCount >= this.usage.totalLimit) return false;
  return true;
};

couponSchema.methods.calculateDiscount = function(subtotal, categoryIds, productIds) {
  if (!this.isValid()) return 0;
  
  if (this.minOrderAmount && subtotal < this.minOrderAmount) return 0;
  
  let applicable = true;
  if (this.applicableCategories?.length > 0) {
    applicable = categoryIds?.some(c => this.applicableCategories.includes(c));
  }
  if (this.applicableProducts?.length > 0) {
    applicable = productIds?.some(p => this.applicableProducts.includes(p));
  }
  if (!applicable) return 0;
  
  let discount = 0;
  if (this.type === 'PERCENTAGE') {
    discount = (subtotal * this.value) / 100;
  } else if (this.type === 'FIXED') {
    discount = this.value;
  } else if (this.type === 'FREE_SHIPPING') {
    return -1; // Special flag for free shipping
  }
  
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }
  
  return discount;
};

module.exports = mongoose.model('Coupon', couponSchema);