const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const TokenService = require('../services/token.service');
const AuditService = require('../services/audit.service');

const generateToken = (userId) => {
  // Use the new token service for short-lived access + refresh tokens
  const tokens = TokenService.generateTokenPair(userId, 'customer');
  return tokens.accessToken;
};

const generateResetToken = (userId) => {
  return jwt.sign({ userId, type: 'reset' }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '1h' });
};

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || req.headers['x-real-ip'] || '';
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }
    
    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    // Generate new token pair
    const tokens = TokenService.generateTokenPair(user._id, user.role);
    
    // Log the token refresh
    AuditService.audit.tokenRefresh(user, req);
    
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Error refreshing token' });
  }
};

// Logout - invalidate tokens client-side (we don't store tokens in DB)
exports.logout = async (req, res) => {
  try {
    // Log the logout
    if (req.user) {
      AuditService.audit.logout(req.user, req);
    }
    
    // Clear the token cookie
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    const { user, tokens, isNew } = req.user;
    
    // Set cookies
    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Log the Google login
    AuditService.audit.login(user, { headers: req.headers, path: '/auth/google' }, true).catch(console.error);
    
    // Redirect to frontend with token
    const redirectUrl = isNew 
      ? `${process.env.FRONTEND_URL}/auth/welcome?token=${tokens.accessToken}`
      : `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
  }
};

// Availability Alert - Subscribe
exports.subscribeAvailabilityAlert = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if already subscribed
    const existingAlert = user.availabilityAlerts?.find(
      a => a.product.toString() === productId && !a.notified
    );
    
    if (existingAlert) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already subscribed to get notified when this product is back in stock' 
      });
    }
    
    // Add alert
    if (!user.availabilityAlerts) {
      user.availabilityAlerts = [];
    }
    
    user.availabilityAlerts.push({
      product: productId,
      createdAt: new Date(),
      notified: false
    });
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'We will notify you when this product is back in stock' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Availability Alert - Unsubscribe
exports.unsubscribeAvailabilityAlert = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Remove alert
    if (user.availabilityAlerts) {
      user.availabilityAlerts = user.availabilityAlerts.filter(
        a => a.product.toString() !== productId
      );
      await user.save();
    }
    
    res.json({ success: true, message: 'Alert removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's availability alerts
exports.getAvailabilityAlerts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const user = await User.findById(req.user._id)
      .populate('availabilityAlerts.product', 'name slug pricing media');
    
    const alerts = user.availabilityAlerts?.map(alert => ({
      product: alert.product,
      createdAt: alert.createdAt,
      notified: alert.notified
    })) || [];
    
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or phone already exists' 
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone: phone.replace(/\s/g, ''),
      isVerified: false
    });

    const token = generateToken(user._id);
    const verifyToken = generateToken(user._id);

    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendVerificationEmail(user, verifyToken);
    } catch (emailErr) {
      console.error('Verification email failed:', emailErr.message);
    }

    // Set JWT in httpOnly cookie (secure)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also return token for backward compatibility
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email, 'isActive:', user.isActive, 'isVerified:', user.isVerified);
    
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const isFirstLogin = !user.lastLoginIp || user.lastLoginIp !== clientIp;
    
    if (isFirstLogin && user.loginCount === 0) {
      user.firstLoginAt = new Date();
    }
    
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    if (user.role === 'admin' || user.role === 'supervisor') {
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({
        adminId: user._id,
        adminName: `${user.firstName} ${user.lastName}`,
        adminEmail: user.email,
        action: 'LOGIN',
        resource: 'AUTH',
        description: 'Admin logged in',
        ipAddress: clientIp,
        userAgent
      }).catch(err => console.error('Audit login error:', err));
    }

    if (isFirstLogin) {
      const EmailService = require('../services/email.service');
      try {
        await EmailService.sendLoginConfirmation(user, clientIp, userAgent, user.loginCount === 1);
      } catch (emailErr) {
        console.error('Login confirmation email failed:', emailErr.message);
      }
    }

    // Generate token pair (access + refresh)
    const tokens = TokenService.generateTokenPair(user._id, user.role);

    // Set JWT in httpOnly cookie (secure)
    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes - access token
    });
    
    // Also set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days - refresh token
    });

    // Audit logging for login
    AuditService.audit.login(user, req, true).catch(err => 
      console.error('[Audit] Login log error:', err.message)
    );

    // Also return token for backward compatibility
    res.json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      warning: user.isVerified ? null : 'Veuillez vérifier votre email pour accéder à toutes les fonctionnalités'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If email exists, reset link sent' });
    }

    const resetToken = generateResetToken(user._id);

    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'If email exists, reset link sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    if (decoded.type !== 'reset') {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendWelcomeEmail(user);
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr.message);
    }

    const authToken = generateToken(user._id);

    // Set JWT in httpOnly cookie (secure)
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Also return token for backward compatibility
    res.json({
      success: true,
      message: 'Email verified successfully',
      token: authToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    console.log('📧 Resend verification - userId:', userId, 'req.user:', req.user);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    console.log('📧 Creating verification token for:', user.email);
    const verifyToken = generateToken(user._id);

    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendVerificationEmail(user, verifyToken);
    } catch (emailErr) {
      console.error('📧 Verification email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('📧 Resend verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified
    } });
  } catch (error) {
    console.error('GET /auth/me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, address },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, governorate, city, streetAddress, postalCode, additionalInfo, label, isDefault } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user.addresses) user.addresses = [];
    
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses.push({
      fullName,
      phone,
      governorate,
      city,
      streetAddress,
      postalCode,
      additionalInfo,
      label: label || 'Adresse',
      isDefault: isDefault || false
    });
    
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { fullName, phone, governorate, city, streetAddress, postalCode, additionalInfo, label, isDefault } = req.body;
    
    const user = await User.findById(req.user.id);
    const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.id);
    
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      fullName,
      phone,
      governorate,
      city,
      streetAddress,
      postalCode,
      additionalInfo,
      label: label || user.addresses[addressIndex].label,
      isDefault: isDefault || false
    };
    
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.addresses.forEach(a => {
      a.isDefault = a._id.toString() === req.params.id;
    });
    
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};