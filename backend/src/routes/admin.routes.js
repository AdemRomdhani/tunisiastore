const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');
const upload = require('../middleware/upload');
const { auditLog } = require('../middleware/auditLog');

router.get('/stats', authenticate, authorize('admin', 'supervisor'), adminController.getDashboardStats);
router.get('/analytics', authenticate, authorize('admin', 'supervisor'), adminController.getDashboardStats);
router.get('/charts', authenticate, authorize('admin', 'supervisor'), adminController.getChartData);

router.get('/products', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getAllProductsAdmin);
router.get('/products/low-stock', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getLowStockProducts);
router.get('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getProductByIdAdmin);
router.post('/products', authenticate, authorize('admin', 'supervisor', 'moderator'), upload.array('images', 5), auditLog('CREATE', 'PRODUCT'), adminController.createProductAdmin);
router.put('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), upload.array('images', 5), auditLog('UPDATE', 'PRODUCT'), adminController.updateProductAdmin);
router.delete('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('DELETE', 'PRODUCT'), adminController.deleteProductAdmin);
router.post('/products/bulk', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'PRODUCT'), adminController.bulkUpdateProducts);
router.post('/products/:id/duplicate', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('CREATE', 'PRODUCT'), adminController.duplicateProduct);
router.post('/products/:id/add-stock', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'PRODUCT'), adminController.addStock);

// Availability Alerts
router.get('/availability-alerts/product/:productId', authenticate, authorize('admin', 'supervisor'), adminController.getProductAlerts);
router.post('/availability-alerts/notify/:productId', authenticate, authorize('admin', 'supervisor'), auditLog('UPDATE', 'PRODUCT'), adminController.notifyAvailability);

// Orders
router.get('/orders', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getAllOrdersAdmin);
router.get('/orders/count/pending', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getPendingOrdersCount);
router.put('/orders/:id/status', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.updateOrderStatusAdmin);
router.delete('/orders/:id', authenticate, authorize('admin', 'supervisor'), adminController.deleteOrderAdmin);
router.post('/orders/bulk-status', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.bulkUpdateOrders);
router.post('/orders/:id/notes', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.addOrderNote);
router.get('/orders/:id/notes', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getOrderNotes);
router.get('/orders/:id/invoice', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.printInvoice);

// Users
router.get('/users', authenticate, authorize('admin', 'supervisor'), adminController.getAllUsers);
router.put('/users/:id', authenticate, authorize('admin', 'supervisor'), adminController.updateUser);
router.get('/users/:id/orders', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getUserOrders);
router.get('/users/new-count', authenticate, authorize('admin', 'supervisor'), adminController.getNewUsersCount);
router.get('/export/users', authenticate, authorize('admin', 'supervisor'), adminController.exportUsers);
router.get('/export/orders', authenticate, authorize('admin', 'supervisor'), adminController.exportOrders);

// Contacts
router.get('/contacts', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.getAllContacts);
router.put('/contacts/:id/read', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.markContactAsRead);
router.post('/contacts/read-all', authenticate, authorize('admin', 'supervisor', 'moderator'), adminController.markAllContactsAsRead);
router.delete('/contacts/:id', authenticate, authorize('admin', 'supervisor'), adminController.deleteContact);

// Returns
const returnController = require('../controllers/return.controller');
router.get('/returns', authenticate, authorize('admin', 'supervisor', 'moderator'), returnController.getAllReturns);
router.put('/returns/:id', authenticate, authorize('admin', 'supervisor'), returnController.updateReturn);

module.exports = router;