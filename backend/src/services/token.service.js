// JWT Token Service with Refresh Token support for Tunisia Store API

const jwt = require('jsonwebtoken');

// Token configuration
const TOKEN_CONFIG = {
  accessToken: {
    expiresIn: '24h', // 24 hours - increased for better UX
    issuer: 'tunisia-store',
    audience: 'tunisia-store-api'
  },
  refreshToken: {
    expiresIn: '7d', // 7 days - longer for convenience
    issuer: 'tunisia-store-refresh',
    audience: 'tunisia-store-api'
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

/**
 * Generate an access token (short-lived)
 */
function generateAccessToken(userId, role = 'customer') {
  return jwt.sign(
    { 
      userId, 
      role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    {
      expiresIn: TOKEN_CONFIG.accessToken.expiresIn,
      issuer: TOKEN_CONFIG.accessToken.issuer,
      audience: TOKEN_CONFIG.accessToken.audience
    }
  );
}

/**
 * Generate a refresh token (longer-lived)
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { 
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET, // Use same secret for simplicity (or use separate JWT_REFRESH_SECRET)
    {
      expiresIn: TOKEN_CONFIG.refreshToken.expiresIn,
      issuer: TOKEN_CONFIG.refreshToken.issuer,
      audience: TOKEN_CONFIG.refreshToken.audience
    }
  );
}

/**
 * Generate both access and refresh tokens for a user
 */
function generateTokenPair(userId, role = 'customer') {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: TOKEN_CONFIG.accessToken.expiresIn,
    refreshExpiresIn: TOKEN_CONFIG.refreshToken.expiresIn
  };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: TOKEN_CONFIG.accessToken.issuer,
      audience: TOKEN_CONFIG.accessToken.audience
    });
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: TOKEN_CONFIG.refreshToken.issuer,
      audience: TOKEN_CONFIG.refreshToken.audience
    });
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 */
function getTokenExpiration(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

module.exports = {
  // Token generation
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  
  // Token verification
  verifyAccessToken,
  verifyRefreshToken,
  
  // Helpers
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  
  // Configuration (for reference)
  TOKEN_CONFIG
};