// Audit Logging Service for Tunisia Store API
// Tracks all important actions for security and compliance

const mongoose = require('mongoose');

// Audit Log Schema - Extended for comprehensive logging
const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true, 
    index: true 
  },
  category: { 
    type: String, 
    enum: ['auth', 'user', 'product', 'order', 'payment', 'admin', 'system', 'security'],
    required: true,
    index: true
  },
  
  // Who performed the action (for new format)
  user: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String,
    role: String,
    ip: String,
    userAgent: String
  },
  
  // Legacy fields (for backward compatibility with old model)
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: String,
  adminEmail: String,
  
  // Target of the action
  target: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,
  
  // What changed
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String]
  },
  
  // Request details
  request: {
    method: String,
    path: String,
    query: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed
  },
  
  // Result
  success: { type: Boolean, default: true, index: true },
  errorMessage: String,
  description: String,
  
  // Metadata
  metadata: {
    source: { type: String, default: 'api' },
    requestId: String,
    sessionId: String
  },
  
  // Legacy fields
  ipAddress: String,
  userAgent: String
}, { 
  timestamps: true 
});

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLogExtended || mongoose.model('AuditLogExtended', auditLogSchema);

// Action types
const ACTIONS = {
  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',
  TOKEN_REFRESH: 'token_refresh',
  
  // User actions
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ACTIVATE: 'user_activate',
  USER_DEACTIVATE: 'user_deactivate',
  
  // Product actions
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  PRODUCT_VIEW: 'product_view',
  
  // Order actions
  ORDER_CREATE: 'order_create',
  ORDER_UPDATE: 'order_update',
  ORDER_CANCEL: 'order_cancel',
  ORDER_REFUND: 'order_refund',
  
  // Payment actions
  PAYMENT_INITIATE: 'payment_initiate',
  PAYMENT_COMPLETE: 'payment_complete',
  PAYMENT_FAILED: 'payment_failed',
  
  // Admin actions
  SETTINGS_CHANGE: 'settings_change',
  COUPON_CREATE: 'coupon_create',
  CATEGORY_CREATE: 'category_create',
  
  // Security actions
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  UNAUTHORIZED_ACCESS: 'unauthorized_access'
};

const CATEGORIES = {
  AUTH: 'auth',
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  PAYMENT: 'payment',
  ADMIN: 'admin',
  SYSTEM: 'system',
  SECURITY: 'security'
};

/**
 * Create an audit log entry
 */
async function logAction(params) {
  try {
    const {
      action,
      category,
      user = {},
      target = {},
      changes = {},
      request = {},
      success = true,
      errorMessage = null,
      metadata = {}
    } = params;

    const logEntry = await AuditLog.create({
      action,
      category,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        ip: user.ip,
        userAgent: user.userAgent
      },
      target: {
        type: target.type,
        id: target.id,
        name: target.name
      },
      changes,
      request: {
        method: request.method,
        path: request.path,
        query: request.query,
        body: sanitizeBody(request.body)
      },
      success,
      errorMessage,
      metadata
    });

    // Don't await this - log async but don't block
    return logEntry;
  } catch (error) {
    console.error('[Audit] Failed to create log:', error.message);
    // Don't throw - audit logging should not break app flow
  }
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
  if (!body) return undefined;
  
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey', 'creditCard', 'cvv'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Also sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Quick logging helper for common actions
 */
const audit = {
  login: (user, req, success) => logAction({
    action: ACTIONS.LOGIN,
    category: CATEGORIES.AUTH,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    },
    request: { method: req.method, path: req.path },
    success
  }),
  
  logout: (user, req) => logAction({
    action: ACTIONS.LOGOUT,
    category: CATEGORIES.AUTH,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req)
    },
    request: { method: req.method, path: req.path }
  }),
  
  register: (user, req) => logAction({
    action: ACTIONS.REGISTER,
    category: CATEGORIES.AUTH,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req)
    },
    request: { method: req.method, path: req.path },
    changes: { after: { email: user.email, role: user.role } }
  }),
  
  productUpdate: (user, req, before, after) => logAction({
    action: ACTIONS.PRODUCT_UPDATE,
    category: CATEGORIES.PRODUCT,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req)
    },
    target: { type: 'Product', id: req.params.id, name: after?.name },
    changes: { before, after, fields: getChangedFields(before, after) },
    request: { method: req.method, path: req.path }
  }),
  
  orderUpdate: (user, req, before, after) => logAction({
    action: ACTIONS.ORDER_UPDATE,
    category: CATEGORIES.ORDER,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req)
    },
    target: { type: 'Order', id: after?._id, name: after?.orderNumber },
    changes: { before: { status: before?.status }, after: { status: after?.status } },
    request: { method: req.method, path: req.path }
  }),
  
  adminAction: (user, req, action, details) => logAction({
    action,
    category: CATEGORIES.ADMIN,
    user: {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: getClientIp(req)
    },
    request: { method: req.method, path: req.path, body: req.body },
    changes: details
  }),
  
  securityEvent: (req, action, details) => logAction({
    action,
    category: CATEGORIES.SECURITY,
    user: { ip: getClientIp(req), userAgent: req.headers['user-agent'] },
    request: { method: req.method, path: req.path },
    success: false,
    ...details
  })
};

/**
 * Helper: Get client IP from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || req.headers['x-real-ip'] 
    || 'unknown';
}

/**
 * Helper: Get changed fields between two objects
 */
function getChangedFields(before, after) {
  if (!before || !after) return [];
  const fields = [];
  for (const key in after) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      fields.push(key);
    }
  }
  return fields;
}

/**
 * Query audit logs (for admin dashboard)
 */
async function queryLogs(filters = {}, options = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId, action, category } = options;
  
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (userId) query['user.userId'] = userId;
  if (action) query.action = action;
  if (category) query.category = category;
  
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  const total = await AuditLog.countDocuments(query);
  
  return {
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

/**
 * Get user activity summary
 */
async function getUserActivity(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await AuditLog.aggregate([
    {
      $match: {
        'user.userId': new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

/**
 * Get security events summary
 */
async function getSecurityEvents(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await AuditLog.aggregate([
    {
      $match: {
        category: CATEGORIES.SECURITY,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user.ip' }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

module.exports = {
  AuditLog,
  logAction,
  audit,
  queryLogs,
  getUserActivity,
  getSecurityEvents,
  ACTIONS,
  CATEGORIES
};