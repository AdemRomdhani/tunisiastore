const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// Admin routes
router.post('/', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('CREATE', 'CATEGORY'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'CATEGORY'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('DELETE', 'CATEGORY'), categoryController.deleteCategory);

module.exports = router;