const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6, select: false }, // Not required for social login
  phone: { type: String },
  role: { type: String, enum: ['customer', 'admin', 'supervisor'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  
  // Social Login (Google)
  googleId: { type: String, unique: true, sparse: true },
  googleProfile: {
    name: String,
    picture: String
  },
  facebookId: { type: String, unique: true, sparse: true },
  facebookProfile: {
    name: String,
    picture: String
  },
  
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  
  lastLogin: Date,
  lastLoginIp: String,
  loginCount: { type: Number, default: 0 },
  firstLoginAt: Date,
  
  // Availability alerts (when product is back in stock)
  availabilityAlerts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    createdAt: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false }
  }],

  addresses: [{
    fullName: String,
    phone: String,
    governorate: String,
    city: String,
    streetAddress: String,
    postalCode: String,
    additionalInfo: String,
    isDefault: { type: Boolean, default: false },
    label: { type: String, default: 'Adresse' }
  }],
  
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  recentlyViewed: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);