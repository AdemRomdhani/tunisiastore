const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Coupon = require('../../models/Coupon');
const Newsletter = require('../../models/Newsletter');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      ordersThisMonth,
      ordersThisWeek,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      lowStockCount,
      lowStockRuptureCount,
      pendingOrders,
      coupons,
      newsletterSubs,
      topProducts,
      ordersByStatus,
      ordersByGovernorate
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'firstName lastName email phone'),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.aggregate([
        { $match: { 'payment.status': 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { $expr: { $gte: ['$createdAt', thirtyDaysAgo] }, 'payment.status': 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { $expr: { $gte: ['$createdAt', sevenDaysAgo] }, 'payment.status': 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Product.countDocuments({ $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] } }),
      Product.countDocuments({ $expr: { $lte: ['$inventory.quantity', '$inventory.reserved'] } }),
      Order.countDocuments({ status: 'PENDING' }),
      Coupon.countDocuments({ isActive: true }),
      Newsletter.countDocuments({ isActive: true }),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$shippingAddress.governorate', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    await Product.populate(topProducts, { path: '_id', select: 'name pricing images' });

    res.json({
      success: true,
      stats: {
        totals: {
          orders: totalOrders,
          revenue: totalRevenue[0]?.total || 0,
          users: totalUsers,
          products: totalProducts,
          subscribers: newsletterSubs[0]?.count || 0,
          activeCoupons: coupons
        },
        periods: {
          ordersThisMonth,
          ordersThisWeek,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          weeklyRevenue: weeklyRevenue[0]?.total || 0
        },
        alerts: {
          lowStock: lowStockCount,
          ruptureStock: lowStockRuptureCount,
          pendingOrders
        },
        recentOrders,
        topProducts: topProducts.map(p => ({
          product: p._id,
          totalSold: p.totalSold
        })),
        ordersByStatus: ordersByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        ordersByGovernorate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getChartData = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    const [dailyOrders, monthlyRevenue, ordersByStatus, ordersByGovernorate, topCategories] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo }, 'payment.status': 'COMPLETED' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$shippingAddress.governorate', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const Category = require('../../models/Category');
    await Category.populate(topCategories, { path: '_id', select: 'name' });

    res.json({
      success: true,
      chartData: {
        dailyOrders,
        monthlyRevenue,
        ordersByStatus: ordersByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        ordersByGovernorate,
        topCategories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNewUsersCount = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: sevenDaysAgo }
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
