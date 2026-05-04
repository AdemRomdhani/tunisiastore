const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, orderController.createOrder);
router.post('/track', orderController.trackOrder);
router.post('/cancel/:id', authenticate, orderController.cancelOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);
router.get('/my-orders', authenticate, orderController.getOrders);
router.get('/my-orders/:id', authenticate, orderController.getOrder);

// Admin routes
router.get('/', authenticate, authorize('admin', 'moderator'), orderController.getAllOrders);
router.put('/:id/status', authenticate, authorize('admin', 'moderator'), orderController.updateStatus);

module.exports = router;