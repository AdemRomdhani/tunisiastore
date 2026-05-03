const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
  }],
  
  pricing: {
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discountPercentage: Number,
    currency: { type: String, default: 'TND' }
  },
  
  badges: [{
    type: String,
    enum: ['PROMO', 'NEW', 'BESTSELLER', 'LIMITED', 'FREE_SHIPPING']
  }],
  
  isActive: { type: Boolean, default: true },
  
  validUntil: Date,
  
  maxUses: Number,
  usedCount: { type: Number, default: 0 }
}, { timestamps: true });

bundleSchema.pre('save', function(next) {
  if (this.pricing.originalPrice && this.pricing.price) {
    this.pricing.discountPercentage = Math.round(
      ((this.pricing.originalPrice - this.pricing.price) / this.pricing.originalPrice) * 100
    );
  }
  next();
});

bundleSchema.methods.calculateSavings = function() {
  let originalTotal = 0;
  for (const item of this.products) {
    const product = item.product;
    if (product?.pricing?.price) {
      originalTotal += product.pricing.price * item.quantity;
    }
  }
  return originalTotal - this.pricing.price;
};

module.exports = mongoose.model('Bundle', bundleSchema);