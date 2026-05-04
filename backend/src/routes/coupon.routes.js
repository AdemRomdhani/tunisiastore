const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const auth = optionalAuth;

router.post('/validate', auth, couponController.validateCoupon);
router.post('/apply', auth, couponController.applyCoupon);
router.get('/', auth, authorize('admin', 'supervisor'), couponController.getCoupons);
router.post('/', auth, authorize('admin', 'supervisor'), auditLog('CREATE', 'COUPON'), couponController.createCoupon);
router.put('/:id', auth, authorize('admin', 'supervisor'), auditLog('UPDATE', 'COUPON'), couponController.updateCoupon);
router.delete('/:id', auth, authorize('admin', 'supervisor'), auditLog('DELETE', 'COUPON'), couponController.deleteCoupon);

module.exports = router;