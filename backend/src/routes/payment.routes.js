const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

router.post('/initiate', authenticate, paymentController.initiatePayment);
router.get('/verify/:paymentRef', authenticate, paymentController.verifyPayment);
router.post('/webhook', paymentController.webhook); // Public endpoint for Konnect

module.exports = router;