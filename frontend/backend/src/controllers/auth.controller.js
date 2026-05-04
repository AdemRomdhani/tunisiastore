const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' });
};

const generateResetToken = (userId) => {
  return jwt.sign({ userId, type: 'reset' }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '1h' });
};

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || req.headers['x-real-ip'] || '';
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

    const token = generateToken(user._id);

    // Set JWT in httpOnly cookie (secure)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also return token for backward compatibility
    res.json({
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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