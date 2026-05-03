const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);
router.get('/', authenticate, authorize('admin', 'supervisor', 'moderator'), newsletterController.getSubscribers);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('DELETE', 'NEWSLETTER'), newsletterController.deleteSubscriber);

module.exports = router;