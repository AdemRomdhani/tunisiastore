const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const reviewController = require('../controllers/review.controller');

// Configure multer for review images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reviews');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.createReview);

// Upload images to a review
router.post('/:id/images', authenticate, upload.array('images', 5), reviewController.uploadReviewImages);

// Get user's reviews
router.get('/my-reviews', authenticate, reviewController.getMyReviews);

// Mark review as helpful
router.post('/:id/helpful', authenticate, reviewController.markHelpful);

router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;