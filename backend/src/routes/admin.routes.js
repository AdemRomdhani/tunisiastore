const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { auditLog } = require('../middleware/auditLog');

const productController = require('../controllers/admin/admin-product.controller');
const orderController = require('../controllers/admin/admin-order.controller');
const dashboardController = require('../controllers/admin/admin-dashboard.controller');
const userController = require('../controllers/admin/admin-user.controller');
const contactController = require('../controllers/admin/admin-contact.controller');
const miscController = require('../controllers/admin/admin-misc.controller');
const returnController = require('../controllers/return.controller');

// Dashboard
router.get('/stats', authenticate, authorize('admin', 'supervisor'), dashboardController.getDashboardStats);
router.get('/analytics', authenticate, authorize('admin', 'supervisor'), dashboardController.getDashboardStats);
router.get('/charts', authenticate, authorize('admin', 'supervisor'), dashboardController.getChartData);
router.get('/users/new-count', authenticate, authorize('admin', 'supervisor'), dashboardController.getNewUsersCount);

// Products
router.get('/products', authenticate, authorize('admin', 'supervisor', 'moderator'), productController.getAllProductsAdmin);
router.get('/products/low-stock', authenticate, authorize('admin', 'supervisor', 'moderator'), productController.getLowStockProducts);
router.get('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), productController.getProductByIdAdmin);
router.post('/products', authenticate, authorize('admin', 'supervisor', 'moderator'), upload.array('images', 5), auditLog('CREATE', 'PRODUCT'), productController.createProductAdmin);
router.put('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), upload.array('images', 5), auditLog('UPDATE', 'PRODUCT'), productController.updateProductAdmin);
router.delete('/products/:id', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('DELETE', 'PRODUCT'), productController.deleteProductAdmin);
router.post('/products/bulk', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'PRODUCT'), productController.bulkUpdateProducts);
router.post('/products/:id/duplicate', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('CREATE', 'PRODUCT'), productController.duplicateProduct);
router.post('/products/:id/add-stock', authenticate, authorize('admin', 'supervisor', 'moderator'), auditLog('UPDATE', 'PRODUCT'), productController.addStock);

// Availability Alerts
router.get('/availability-alerts/product/:productId', authenticate, authorize('admin', 'supervisor'), miscController.getProductAlerts);
router.post('/availability-alerts/notify/:productId', authenticate, authorize('admin', 'supervisor'), auditLog('UPDATE', 'PRODUCT'), miscController.notifyAvailability);

// Orders
router.get('/orders', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.getAllOrdersAdmin);
router.get('/orders/count/pending', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.getPendingOrdersCount);
router.put('/orders/:id/status', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.updateOrderStatusAdmin);
router.delete('/orders/:id', authenticate, authorize('admin', 'supervisor'), orderController.deleteOrderAdmin);
router.post('/orders/bulk-status', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.bulkUpdateOrders);
router.post('/orders/:id/notes', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.addOrderNote);
router.get('/orders/:id/notes', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.getOrderNotes);
router.get('/orders/:id/invoice', authenticate, authorize('admin', 'supervisor', 'moderator'), orderController.printInvoice);

// Users
router.get('/users', authenticate, authorize('admin', 'supervisor'), userController.getAllUsers);
router.put('/users/:id', authenticate, authorize('admin', 'supervisor'), userController.updateUser);
router.get('/users/:id/orders', authenticate, authorize('admin', 'supervisor', 'moderator'), userController.getUserOrders);
router.get('/export/users', authenticate, authorize('admin', 'supervisor'), userController.exportUsers);
router.get('/export/orders', authenticate, authorize('admin', 'supervisor'), orderController.exportOrders);

// Contacts
router.get('/contacts', authenticate, authorize('admin', 'supervisor', 'moderator'), contactController.getAllContacts);
router.put('/contacts/:id/read', authenticate, authorize('admin', 'supervisor', 'moderator'), contactController.markContactAsRead);
router.post('/contacts/read-all', authenticate, authorize('admin', 'supervisor', 'moderator'), contactController.markAllContactsAsRead);
router.delete('/contacts/:id', authenticate, authorize('admin', 'supervisor'), contactController.deleteContact);

// Returns
router.get('/returns', authenticate, authorize('admin', 'supervisor', 'moderator'), returnController.getAllReturns);
router.put('/returns/:id', authenticate, authorize('admin', 'supervisor'), returnController.updateReturn);

// Abandoned carts
router.get('/abandoned-carts/stats', authenticate, authorize('admin', 'supervisor'), miscController.getAbandonedCartStats);
router.get('/abandoned-carts', authenticate, authorize('admin', 'supervisor'), miscController.getAbandonedCarts);

// Audit logs
router.get('/audit-logs', authenticate, authorize('admin', 'supervisor'), miscController.getAuditLogs);
router.get('/audit-logs/security', authenticate, authorize('admin', 'supervisor'), miscController.getAuditSecurityEvents);
router.get('/audit-logs/user/:userId', authenticate, authorize('admin', 'supervisor'), miscController.getAuditUserActivity);

// Test email
router.get('/test-email', authenticate, authorize('admin'), miscController.testEmail);

module.exports = router;
