const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, cartController.getCart);
router.post('/add', optionalAuth, cartController.addToCart);
router.put('/item/:itemId', optionalAuth, cartController.updateQuantity);
router.delete('/item/:itemId', optionalAuth, cartController.removeFromCart);
router.delete('/clear', optionalAuth, cartController.clearCart);

// Guest checkout enhancements
router.post('/guest-email', optionalAuth, cartController.setGuestEmail);
router.post('/guest-phone', optionalAuth, cartController.setGuestPhone);

module.exports = router;