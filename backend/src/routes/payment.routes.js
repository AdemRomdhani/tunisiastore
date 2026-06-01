const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

// Configure multer for bank transfer proofs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed'));
  }
});

// Public routes
router.post('/webhook', paymentController.webhook); // Konnect webhook
router.post('/stripe-webhook', express.raw({type: 'application/json'}), paymentController.stripeWebhook); // Stripe webhook

// Customer routes (authenticated)
router.post('/initiate', authenticate, paymentController.initiatePayment);
router.get('/verify/:paymentRef', authenticate, paymentController.verifyPayment);
router.get('/bank-transfer/:orderId', authenticate, paymentController.getBankTransferDetails);
router.post('/bank-transfer/:orderId/proof', authenticate, upload.single('proof'), paymentController.uploadBankTransferProof);

// Admin routes
router.put('/bank-transfer/:orderId/verify', authenticate, authorize('admin', 'supervisor'), paymentController.verifyBankTransfer);
router.post('/refund/:orderId', authenticate, authorize('admin', 'supervisor'), paymentController.processRefund);
router.get('/invoice/:orderId', authenticate, paymentController.generateInvoice);

module.exports = router;