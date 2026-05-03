const Bundle = require('../models/Bundle');
const Product = require('../models/Product');

exports.getBundles = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive } = req.query;
    
    const includeInactiveBool = includeInactive === 'true' || includeInactive === true;
    
    const query = {};
    if (!includeInactiveBool) {
      query.isActive = true;
    }
    
    const bundles = await Bundle.find(query)
      .populate('products.product', 'name slug pricing media badges isActive inventory')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Bundle.countDocuments(includeInactiveBool ? {} : { isActive: true });
    
    res.json({
      success: true,
      bundles,
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

exports.getBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findOne({ slug: req.params.slug, isActive: true })
      .populate('products.product', 'name slug pricing media badges specifications isActive inventory');
    
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }
    
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBundle = async (req, res) => {
  try {
    const bundle = await Bundle.create(req.body);
    res.status(201).json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }
    
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }
    
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};