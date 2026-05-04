const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, unique: true, sparse: true },
  deviceId: { type: String, default: null },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Separate indexes for user and deviceId - sparse handles the null case
recentlyViewedSchema.index({ user: 1 }, { unique: true, sparse: true });
recentlyViewedSchema.index({ deviceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema);