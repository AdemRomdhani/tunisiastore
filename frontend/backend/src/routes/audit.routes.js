const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      resource,
      adminId,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (adminId) query.adminId = adminId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { resourceName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayActions,
      totalActions,
      byResource,
      byAction,
      recentAdmins
    ] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.countDocuments(),
      AuditLog.aggregate([
        { $group: { _id: '$resource', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: '$adminId',
            adminName: { $first: '$adminName' },
            actionCount: { $sum: 1 }
          }
        },
        { $sort: { actionCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        todayActions,
        totalActions,
        byResource: byResource.reduce((acc, r) => {
          acc[r._id] = r.count;
          return acc;
        }, {}),
        byAction: byAction.reduce((acc, r) => {
          acc[r._id] = r.count;
          return acc;
        }, {}),
        recentAdmins
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logAction = async (adminId, adminName, adminEmail, action, resource, data) => {
  try {
    const log = new AuditLog({
      adminId,
      adminName,
      adminEmail,
      action: data.action || action,
      resource: data.resource || resource,
      resourceId: data.resourceId,
      resourceName: data.resourceName,
      description: data.description,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

router.get('/', authenticate, authorize('supervisor'), exports.getAuditLogs);
router.get('/stats', authenticate, authorize('supervisor'), exports.getAuditStats);

module.exports = router;