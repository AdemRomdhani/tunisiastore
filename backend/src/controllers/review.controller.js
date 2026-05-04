const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({ 
      success: true, 
      reviews,
      averageRating: stats[0]?.avg || 0,
      totalReviews: stats[0]?.count || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    
    const existing = await Review.findOne({ product: productId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      title,
      comment
    });

    await updateProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { rating, title, comment },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    await updateProductRating(review.product);

    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function updateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': stats[0]?.avg || 0,
    'ratings.count': stats[0]?.count || 0
  });
}