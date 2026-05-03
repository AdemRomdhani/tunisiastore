const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundle.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/', bundleController.getBundles);
router.get('/:slug', bundleController.getBundle);
router.post('/', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('CREATE', 'BUNDLE'), bundleController.createBundle);
router.put('/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'BUNDLE'), bundleController.updateBundle);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('DELETE', 'BUNDLE'), bundleController.deleteBundle);

module.exports = router;