const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  governorate: {
    type: String,
    required: true,
    enum: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
           'Bizerte', 'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
           'Monastir', 'Mahdia', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
           'Gabes', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili']
  },
  city: {
    type: String,
    required: true
  },
  streetAddress: {
    type: String,
    required: true
  },
  postalCode: String,
  additionalInfo: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    enum: ['HOME', 'WORK', 'OTHER'],
    default: 'OTHER'
  }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);