// Security Middleware Tests
const security = require('../src/middleware/security');

// Mock Sentry before importing modules that use it
jest.mock('../src/config/sentry.config', () => ({
  captureException: jest.fn(),
  initSentry: jest.fn(),
  Sentry: {
    init: jest.fn(),
    captureException: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn()
  }
}));

describe('Security Middleware', () => {
  describe('Input Sanitization', () => {
    it('should export setupSecurity function', () => {
      expect(typeof security.setupSecurity).toBe('function');
    });

    it('should export getRateLimiter function', () => {
      expect(typeof security.getRateLimiter).toBe('function');
    });
  });

  describe('Rate Limiter', () => {
    it('should create a rate limiter with custom config', () => {
      const limiter = security.getRateLimiter('auth');
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should create different limiters for different types', () => {
      const generalLimiter = security.getRateLimiter('general');
      const authLimiter = security.getRateLimiter('auth');
      
      expect(generalLimiter).not.toBe(authLimiter);
    });
  });

  describe('Token Service', () => {
    const TokenService = require('../src/services/token.service');

    it('should generate access and refresh tokens', () => {
      const tokens = TokenService.generateTokenPair('user123', 'customer');
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
      expect(tokens.expiresIn).toBe('24h');
    });

    it('should verify access token', () => {
      const tokens = TokenService.generateTokenPair('user123', 'customer');
      const decoded = TokenService.verifyAccessToken(tokens.accessToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user123');
      expect(decoded.type).toBe('access');
    });

    it('should verify refresh token', () => {
      const tokens = TokenService.generateTokenPair('user123', 'customer');
      const decoded = TokenService.verifyRefreshToken(tokens.refreshToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user123');
      expect(decoded.type).toBe('refresh');
    });

    it('should reject invalid access token', () => {
      const decoded = TokenService.verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should detect expired tokens', () => {
      const expired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxMDAwMDAwMDAwMDAwMDAwfQ.expired';
      const isExpired = TokenService.isTokenExpired(expired);
      expect(isExpired).toBe(true);
    });
  });

  describe('RBAC Middleware', () => {
    const rbac = require('../src/middleware/rbac');

    it('should export RBAC functions', () => {
      expect(typeof rbac.hasPermission).toBe('function');
      expect(typeof rbac.restrictTo).toBe('function');
      expect(typeof rbac.isAdmin).toBe('function');
    });

    it('should return correct permissions for each role', () => {
      const customerPermissions = rbac.getRolePermissions('customer');
      const adminPermissions = rbac.getRolePermissions('admin');
      
      expect(customerPermissions.length).toBeGreaterThan(0);
      expect(adminPermissions.length).toBeGreaterThan(customerPermissions.length);
    });

    it('should include customer permissions in admin', () => {
      const customerPermissions = rbac.getRolePermissions('customer');
      const adminPermissions = rbac.getRolePermissions('admin');
      
      // Admin should have all customer permissions plus more
      customerPermissions.forEach(perm => {
        expect(adminPermissions).toContain(perm);
      });
    });
  });

  describe('Audit Service', () => {
    const AuditService = require('../src/services/audit.service');

    it('should export audit functions', () => {
      expect(typeof AuditService.logAction).toBe('function');
      expect(typeof AuditService.audit).toBe('object');
      expect(typeof AuditService.queryLogs).toBe('function');
    });

    it('should have defined ACTIONS and CATEGORIES', () => {
      expect(AuditService.ACTIONS).toBeDefined();
      expect(AuditService.CATEGORIES).toBeDefined();
      expect(AuditService.ACTIONS.LOGIN).toBe('login');
      expect(AuditService.CATEGORIES.AUTH).toBe('auth');
    });
  });
});
