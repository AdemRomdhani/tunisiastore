const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Load passport config
require('../config/passport');

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

// Google login button config (get client ID)
router.get('/google/config', (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || null,
    enabled: !!process.env.GOOGLE_CLIENT_ID
  });
});

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^(\+216)?[0-9]{8}$/).withMessage('Valid Tunisian phone required')
], authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);

router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);

router.get('/addresses', authenticate, authController.getAddresses);
router.post('/addresses', authenticate, authController.addAddress);
router.put('/addresses/:id', authenticate, authController.updateAddress);
router.delete('/addresses/:id', authenticate, authController.deleteAddress);
router.put('/addresses/:id/default', authenticate, authController.setDefaultAddress);

// Availability Alerts
router.post('/availability-alert', authenticate, authController.subscribeAvailabilityAlert);
router.delete('/availability-alert/:productId', authenticate, authController.unsubscribeAvailabilityAlert);
router.get('/availability-alerts', authenticate, authController.getAvailabilityAlerts);

module.exports = router;