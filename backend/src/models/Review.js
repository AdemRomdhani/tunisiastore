const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 500 },
  // New: Images for reviews
  images: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Helpful votes
  helpful: { type: Number, default: 0 },
  helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);