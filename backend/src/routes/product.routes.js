const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', productController.getProducts);
router.get('/autocomplete', productController.autocomplete);
router.get('/:slug', productController.getProduct);
router.get('/:slug/reviews', productController.getProductReviews);
router.post('/:slug/reviews', authenticate, productController.addReview);
router.post('/', upload.none(), authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('CREATE', 'PRODUCT'), productController.createProduct);
router.put('/:id', upload.none(), authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'PRODUCT'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('DELETE', 'PRODUCT'), productController.deleteProduct);

module.exports = router;