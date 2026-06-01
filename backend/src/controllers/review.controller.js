const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reviews');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

exports.getProductReviews = async (req, res) => {
  try {
    let productId = req.params.productId;

    let product;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId).select('_id');
    }
    if (!product) {
      product = await Product.findOne({ slug: productId }).select('_id');
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ product: product._id })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const stats = await Review.aggregate([
      { $match: { product: product._id } },
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

exports.createReviewFromSlug = async (req, res) => {
  try {
    const { rating, title, comment, productId } = req.body;

    let finalProductId = productId;
    if (!finalProductId) {
      const product = await Product.findOne({ slug: req.params.slug });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      finalProductId = product._id;
    }

    const existing = await Review.findOne({ product: finalProductId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit' });
    }

    const review = await Review.create({
      product: finalProductId,
      user: req.user.id,
      rating,
      title,
      comment
    });

    await updateProductRating(finalProductId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadReviewImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const newImages = req.files.map(file => ({
      url: `/uploads/reviews/${file.filename}`,
      filename: file.filename,
      uploadedAt: new Date()
    }));

    review.images = [...(review.images || []), ...newImages];
    await review.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: review.images
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name slug pricing media')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.helpfulVoters?.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already marked as helpful' });
    }

    review.helpful = (review.helpful || 0) + 1;
    if (!review.helpfulVoters) review.helpfulVoters = [];
    review.helpfulVoters.push(req.user._id);
    await review.save();

    res.json({ success: true, helpful: review.helpful });
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

exports.getProductRatingStats = async (req, res) => {
  try {
    let productId = req.params.productId;

    let product;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId).select('_id');
    }
    if (!product) {
      product = await Product.findOne({ slug: productId }).select('_id');
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      ratings: {
        average: stats[0]?.avg || 0,
        count: stats[0]?.count || 0
      }
    });
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