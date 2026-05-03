const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name slug pricing media badges ratings');
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }
    
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [productId] });
    } else {
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({ success: false, message: 'Product already in wishlist' });
      }
      wishlist.products.push(productId);
      await wishlist.save();
    }
    
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }
    
    wishlist.products = wishlist.products.filter(
      p => p.toString() !== productId
    );
    await wishlist.save();
    
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { products: [] },
      { new: true }
    );
    
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};