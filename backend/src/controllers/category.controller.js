const Category = require('../models/Category');
const CacheService = require('../services/cache.service');

exports.getCategories = async (req, res) => {
  try {
    // Check cache first
    let categories = await CacheService.get('category', 'all');
    
    if (!categories) {
      categories = await Category.find({ isActive: true }).sort('order');
      // Cache for 10 minutes
      await CacheService.set('category', 'all', categories, 10 * 60 * 1000);
    }
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    // Check cache first
    let category = await CacheService.get('category', req.params.id);
    
    if (!category) {
      category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      // Cache for 10 minutes
      await CacheService.set('category', req.params.id, category, 10 * 60 * 1000);
    }
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, order, parent } = req.body;
    
    const category = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      order: order || 0,
      parent: parent || null
    });
    
    // Invalidate categories list cache
    await CacheService.invalidate('category');
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Invalidate category cache
    await CacheService.invalidateCategory(category._id);
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    // Soft delete - set isActive to false
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Invalidate category and products cache
    await CacheService.invalidateCategory(category._id);
    
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
