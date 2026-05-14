const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cms.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/pages', cmsController.getPages);
router.get('/page/:slug', cmsController.getPage);
router.get('/faqs', cmsController.getFaqs);
router.get('/footer-pages', cmsController.getFooterPages);
router.post('/', authenticate, authorize('admin', 'supervisor'), auditLog('CREATE', 'CMS'), cmsController.createPage);
router.put('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('UPDATE', 'CMS'), cmsController.updatePage);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), auditLog('DELETE', 'CMS'), cmsController.deletePage);

module.exports = router;