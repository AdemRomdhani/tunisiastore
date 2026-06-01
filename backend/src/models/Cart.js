const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  deviceId: { type: String, default: null, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedAttributes: [{ name: String, value: String }],
    addedAt: { type: Date, default: Date.now }
  }],
  coupon: {
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'] }
  },
  lastModified: { type: Date, default: Date.now },
  // Abandoned cart recovery fields
  guestEmail: { type: String, default: null, index: true },
  guestPhone: { type: String, default: null },
  reminderCount: { type: Number, default: 0 },
  lastReminderAt: { type: Date, default: null },
  isRecovered: { type: Boolean, default: false },
  recoveredAt: { type: Date, default: null }
}, { timestamps: true });

cartSchema.pre('save', function(next) {
  if (!this.items) this.items = [];
  this.lastModified = Date.now();
  next();
});

// Don't set unique indexes at schema level, handle uniqueness in code
// cartSchema.index({ user: 1 }, { unique: true, sparse: true });
// cartSchema.index({ deviceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Cart', cartSchema);