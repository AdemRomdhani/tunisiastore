const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  
  type: {
    type: String,
    enum: ['PAGE', 'FAQ', 'POLICY'],
    default: 'PAGE'
  },
  
  isActive: { type: Boolean, default: true },
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  order: { type: Number, default: 0 },
  
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

cmsSchema.index({ type: 1, order: 1 });

module.exports = mongoose.model('CMS', cmsSchema);