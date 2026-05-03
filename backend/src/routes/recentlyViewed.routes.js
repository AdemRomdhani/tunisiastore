const express = require('express');
const router = express.Router();
const recentlyViewedController = require('../controllers/recentlyViewed.controller');
const RecentlyViewed = require('../models/RecentlyViewed');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, recentlyViewedController.getRecentlyViewed);
router.post('/add', optionalAuth, recentlyViewedController.addRecentlyViewed);

// Cleanup bad docs
router.post('/cleanup', async (req, res) => {
  try {
    const result = await RecentlyViewed.deleteMany({ 
      $or: [{ user: null }, { user: { $exists: false } }] 
    });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;