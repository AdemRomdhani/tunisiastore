const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: 'text' },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: String,
  
  pricing: {
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    cost: { type: Number, min: 0 }, // For margin calculation
    currency: { type: String, default: 'TND' }
  },
  
  inventory: {
    sku: { type: String, unique: true, sparse: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, default: 0 }, // For pending orders
    lowStockThreshold: { type: Number, default: 5 }
  },
  
  media: {
    images: [{ type: String, required: true }],
    videos: [{ type: String }]
  },
  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: String,
  
  specifications: [{
    group: String, // e.g., "Display", "Processor"
    items: [{ key: String, value: String }]
  }],
  
  attributes: [{
    name: String, // e.g., "Color", "Storage"
    values: [String],
    priceAdjustment: [{ value: String, amount: Number }]
  }],
  
  badges: [{
    type: String,
    enum: ['PROMO', 'NEW', 'BESTSELLER', 'STOCK_LIMITED', 'FREE_SHIPPING', 'EXCLUSIVE']
  }],

  onSale: { type: Boolean, default: false },
  saleEndsAt: { type: Date },
  saleStartsAt: { type: Date },
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: String,
    images: [String],
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  
  // Tunisia-specific: Warranty info
  warranty: {
    duration: { type: Number, default: 12 }, // months
    type: { type: String, enum: ['seller', 'manufacturer', 'extended'], default: 'manufacturer' },
    description: String
  },
  
  // Weight for shipping calculation
  weight: { type: Number, default: 0 }, // kg
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-disable sale when timer expires
productSchema.pre('save', function(next) {
  if (this.onSale && this.saleEndsAt && this.saleEndsAt < new Date()) {
    this.onSale = false;
  }
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.originalPrice && this.pricing.originalPrice > this.pricing.price) {
    return Math.round(((this.pricing.originalPrice - this.pricing.price) / this.pricing.originalPrice) * 100);
  }
  return 0;
});

// Virtual for available stock
productSchema.virtual('availableStock').get(function() {
  return this.inventory.quantity - this.inventory.reserved;
});

// Virtual for real-time sale status
productSchema.virtual('isOnSale').get(function() {
  const now = new Date();
  const hasActiveTimer = this.saleEndsAt && this.saleEndsAt > now;
  const hasPromoBadge = this.badges && this.badges.includes('PROMO');
  return (this.onSale && hasActiveTimer) || (hasPromoBadge && this.onSale !== false);
});

// Indexes
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ category: 1, 'pricing.price': 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);