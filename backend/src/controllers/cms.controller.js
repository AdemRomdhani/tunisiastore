const CMS = require('../models/CMS');

exports.getPage = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await CMS.findOne({ slug, isActive: true });
    
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    res.json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPages = async (req, res) => {
  try {
    const { type } = req.query;
    
    const query = { isActive: true };
    if (type) query.type = type;
    
    const pages = await CMS.find(query)
      .select('slug title type order')
      .sort({ order: 1 });
    
    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const page = await CMS.create({
      ...req.body,
      lastEditedBy: req.user.id
    });
    
    res.status(201).json({ success: true, page });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce slug existe déjà' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await CMS.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastEditedBy: req.user.id },
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    res.json({ success: true, page });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce slug existe déjà pour une autre page' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await CMS.findByIdAndDelete(req.params.id);
    
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const faqs = await CMS.find({ type: 'FAQ', isActive: true })
      .select('title content order')
      .sort({ order: 1 });
    
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};