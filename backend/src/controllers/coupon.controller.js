const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

exports.validateCoupon = async (req, res) => {
  try {
    const code = req.query.code || req.body?.code;
    const { subtotal = 0, categoryIds = [], productIds = [] } = req.body;
    
    console.log('=== VALIDATE COUPON ===', { code, subtotal, body: req.body });
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    
    const coupon = await Coupon.findOne({ code: code.toString().toUpperCase() });
    console.log('Coupon found:', coupon);
    console.log('Coupon validFrom:', coupon?.validFrom);
    console.log('Coupon validUntil:', coupon?.validUntil);
    console.log('Coupon isActive:', coupon?.isActive);
    console.log('Coupon usage:', coupon?.usage);
    console.log('Coupon usedBy:', coupon?.usage?.usedBy);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    
    const userId = req.user?.id;
    if (userId) {
      const userUsedCount = coupon.usage?.usedBy?.filter(id => id.toString() === userId.toString()).length || 0;
      if (coupon.usage?.perUserLimit && userUsedCount >= coupon.usage.perUserLimit) {
        return res.status(400).json({ success: false, message: 'Coupon already used' });
      }
    }
    
    if (coupon.usage?.totalLimit && coupon.usage.usedCount >= coupon.usage.totalLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    
    const discount = coupon.calculateDiscount(
      subtotal,
      categoryIds.map(id => mongoose.Types.ObjectId(id)),
      productIds.map(id => mongoose.Types.ObjectId(id))
    );
    
    console.log('Discount calculated:', discount);
    console.log('Coupon isValid:', coupon.isValid());
    console.log('Now:', new Date());
    
    if (discount === 0 && coupon.type !== 'FREE_SHIPPING') {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon not applicable for this order' 
      });
    }
    
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: discount === -1 ? 'FREE_SHIPPING' : discount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const { subtotal = 0, categoryIds = [], productIds = [] } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toString().toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    
    const userId = req.user?.id;
    const discount = coupon.calculateDiscount(
      subtotal,
      categoryIds,
      productIds
    );
    
    if (discount === 0 && coupon.type !== 'FREE_SHIPPING') {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon not applicable for this order' 
      });
    }
    
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: discount === -1 ? 'FREE_SHIPPING' : discount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    
    const query = {};
    if (active === 'true') query.isActive = true;
    
    const coupons = await Coupon.find(query)
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Coupon.countDocuments(query);
    
    res.json({
      success: true,
      coupons,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.incrementUsage = async (code, userId) => {
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase() },
    { 
      $inc: { 'usage.usedCount': 1 },
      $addToSet: { 'usage.usedBy': userId }
    }
  );
};