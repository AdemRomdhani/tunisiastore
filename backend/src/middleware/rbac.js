// Role-Based Access Control (RBAC) for Tunisia Store API
// Provides granular permission checking beyond simple roles

// Customer permissions
const CUSTOMER_PERMISSIONS = [
  'products:view',
  'products:search',
  'cart:manage',
  'orders:create',
  'orders:view_own',
  'orders:cancel_own',
  'profile:view',
  'profile:edit',
  'address:manage',
  'wishlist:manage',
  'reviews:create',
  'reviews:edit_own',
  'returns:create',
  'newsletter:subscribe'
];

/**
 * Role configuration with permission sets
 */
const ROLE_PERMISSIONS = {
  customer: {
    permissions: CUSTOMER_PERMISSIONS
  },
  admin: {
    permissions: [
      // All customer permissions + admin permissions
      ...CUSTOMER_PERMISSIONS,
      'products:create',
      'products:edit',
      'products:delete',
      'categories:manage',
      'orders:view_all',
      'orders:edit_status',
      'orders:cancel_any',
      'users:view',
      'users:edit',
      'users:deactivate',
      'coupons:manage',
      'cms:manage',
      'newsletter:send',
      'shipping:manage',
      'payments:manage',
      'returns:manage',
      'reports:view',
      'settings:manage'
    ]
  },
  supervisor: {
    permissions: [
      'products:view',
      'products:edit',
      'orders:view_all',
      'orders:edit_status',
      'users:view',
      'coupons:view',
      'returns:manage',
      'reports:view'
    ]
  }
};

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role]?.permissions || [];
}

/**
 * Middleware to check if user has required permission(s)
 * Usage: hasPermission('products:create', 'products:edit') or hasPermission('orders:view_all')
 */
function hasPermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = getRolePermissions(req.user.role);
    
    // Check if user has ALL required permissions (AND logic)
    const hasAllPermissions = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      console.warn(`[RBAC] Access denied: User ${req.user._id} (${req.user.role}) tried to access ${req.path} requiring [${requiredPermissions.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        errorCode: 'FORBIDDEN',
        required: requiredPermissions,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has ANY of the required permissions (OR logic)
 */
function hasAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = getRolePermissions(req.user.role);
    const hasAny = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        errorCode: 'FORBIDDEN',
        required: permissions,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource or is admin/supervisor
 * Used for: orders, addresses, reviews, returns (users can only edit their own)
 */
function isOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access anything
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
      return next();
    }

    // Get the owner of the resource
    try {
      const resourceOwnerId = typeof getOwnerId === 'function' 
        ? await getOwnerId(req)
        : getOwnerId;
      
      // Check if authenticated user is the owner
      if (!resourceOwnerId || resourceOwnerId.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources',
        errorCode: 'NOT_OWNER'
      });
    } catch (error) {
      console.error('[RBAC] Owner check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
}

/**
 * Middleware to restrict to specific roles (backward compatible with existing code)
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized for this action`,
        errorCode: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Middleware for admin-only access
 */
function isAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'supervisor')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      errorCode: 'ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * Combined middleware: Auth + Permission check
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to access this resource',
      errorCode: 'AUTH_REQUIRED'
    });
  }
  next();
}

module.exports = {
  // Main middleware
  hasPermission,
  hasAnyPermission,
  isOwnerOrAdmin,
  restrictTo,
  isAdmin,
  requireAuth,
  
  // Helpers
  getRolePermissions,
  ROLE_PERMISSIONS
};
