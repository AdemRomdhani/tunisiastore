const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// Customer routes
router.post('/', returnController.createReturn);
router.get('/my-returns', returnController.getMyReturns);
router.get('/my-returns/:id', returnController.getReturn);

// Admin routes
router.get('/', authenticate, authorize('admin', 'supervisor', 'moderator'), returnController.getAllReturns);
router.put('/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'RETURN'), returnController.updateReturn);

module.exports = router;