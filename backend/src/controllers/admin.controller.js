const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Newsletter = require('../models/Newsletter');
const Contact = require('../models/Contact');
const SMSService = require('../services/sms.service');
const upload = require('../middleware/upload');

// Helper to build nested object from flat FormData
const buildNestedObject = (body, prefix) => {
  const result = {};
  Object.keys(body).forEach(key => {
    if (key.startsWith(prefix + '[') && key.endsWith(']')) {
      const subKey = key.slice(prefix.length + 1, -1);
      result[subKey] = body[key];
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
};

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProductAdmin = async (req, res) => {
  try {
    const body = req.body;
    
    // Build nested objects from flat FormData
    const pricing = {};
    if (body.price) pricing.price = parseFloat(body.price);
    if (body.originalPrice) pricing.originalPrice = parseFloat(body.originalPrice);
    pricing.currency = 'TND';

    const inventory = {};
    if (body.stock) inventory.quantity = parseInt(body.stock);
    if (body.sku) inventory.sku = body.sku;
    inventory.reserved = 0;

    const images = req.files && req.files.length > 0 
      ? req.files.map(file => upload.getImageUrl(file.path))
      : ['https://placehold.co/400x400?text=No+Image'];

    // Handle badges - parse JSON if string, otherwise use as array
    let badges = [];
    if (body.badges) {
      try {
        badges = typeof body.badges === 'string' ? JSON.parse(body.badges) : body.badges;
      } catch (e) {
        badges = [];
      }
    }

    // Handle featured boolean
    const featured = body.featured === 'true' || body.featured === true;

    // Handle sale timer
    const onSale = body.onSale === 'true' || body.onSale === true;
    let saleEndsAt = undefined;
    if (body.saleEndsAt) {
      const saleEndsAtRaw = new Date(body.saleEndsAt);
      if (!isNaN(saleEndsAtRaw.getTime())) {
        saleEndsAt = saleEndsAtRaw;
      }
    }
    const finalOnSale = onSale || (saleEndsAt && saleEndsAt > new Date());

    const productData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description,
      shortDescription: body.description?.substring(0, 100),
      pricing,
      inventory,
      media: { images },
      category: body.category,
      badges,
      featured,
      onSale: finalOnSale,
      saleEndsAt,
      ratings: { average: 0, count: 0 },
      isActive: true
    };

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProductAdmin = async (req, res) => {
  try {
    const body = req.body;
    const updateData = { ...body };
    const existingProduct = await Product.findById(req.params.id);
    
    // Handle featured boolean
    if (body.featured !== undefined) {
      updateData.featured = body.featured === 'true' || body.featured === true;
    }

    // Handle badges - parse JSON if string
    if (body.badges) {
      try {
        updateData.badges = typeof body.badges === 'string' ? JSON.parse(body.badges) : body.badges;
      } catch (e) {
        delete updateData.badges;
      }
    }

    // Handle sale timer - save exactly what frontend sends
    if (body.saleEndsAt) {
      const saleEndsAtRaw = new Date(body.saleEndsAt);
      if (!isNaN(saleEndsAtRaw.getTime())) {
        updateData.saleEndsAt = saleEndsAtRaw;
      }
    }
    if (body.onSale !== undefined) {
      updateData.onSale = body.onSale === 'true';
    }

    // Build nested pricing object if price is provided
    if (body.price) {
      updateData.pricing = {
        price: parseFloat(body.price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
        currency: 'TND'
      };
    }

    // Build nested inventory object if stock is provided - preserve existing reserved quantity
    if (body.stock !== undefined && existingProduct) {
      const currentReserved = existingProduct.inventory?.reserved || 0;
      const newQuantity = parseInt(body.stock);
      updateData.inventory = {
        quantity: newQuantity + currentReserved,
        sku: body.sku || existingProduct.inventory?.sku,
        reserved: currentReserved
      };
    }
    
    if (req.files && req.files.length > 0) {
      updateData.media = {
        images: req.files.map(file => upload.getImageUrl(file.path))
      };
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({ status: 'PENDING' });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    if (status === 'SHIPPED') order.shipping.shippedAt = new Date();
    if (status === 'DELIVERED') {
      order.shipping.deliveredAt = new Date();
      order.payment.status = 'COMPLETED';
    }

    await order.save();

    // Send SMS notification for shipping/delivery
    try {
      const phone = order.shippingAddress?.phone || order.guestPhone;
      if (phone && (status === 'SHIPPED' || status === 'DELIVERED')) {
        if (status === 'SHIPPED') {
          await SMSService.sendDeliverySMS(order.orderNumber, phone);
        }
      }
    } catch (smsErr) {
      console.error('SMS notification failed:', smsErr.message);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const ruptureProducts = await Product.find({
      $expr: { $lte: ['$inventory.quantity', '$inventory.reserved'] }
    })
    .select('name inventory sku')
    .limit(20);
    
    const faibleProducts = await Product.find({
      $expr: { $gt: ['$inventory.quantity', '$inventory.reserved'] },
      $expr: { $lte: ['$inventory.quantity', { $add: ['$inventory.reserved', threshold] }] }
    })
    .select('name inventory sku')
    .limit(20);

    res.json({ 
      success: true, 
      products: [...ruptureProducts, ...faibleProducts],
      ruptureProducts,
      faibleProducts,
      ruptureCount: ruptureProducts.length,
      faibleCount: faibleProducts.length
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

    const Category = require('../models/Category');
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

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('firstName lastName email phone role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    const usersWithOrderCount = await Promise.all(users.map(async (user) => {
      const orderCount = await Order.countDocuments({ user: user._id });
      return { ...user.toObject(), orderCount };
    }));

    res.json({
      success: true,
      users: usersWithOrderCount,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};

    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('firstName lastName email phone role createdAt isActive');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .populate('items.product', 'name pricing images')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, action, data } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs required' });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await Product.deleteMany({ _id: { $in: productIds } });
        break;
      case 'activate':
        result = await Product.updateMany({ _id: { $in: productIds } }, { isActive: true });
        break;
      case 'deactivate':
        result = await Product.updateMany({ _id: { $in: productIds } }, { isActive: false });
        break;
      case 'updateStock':
        if (data?.stock !== undefined) {
          result = await Product.updateMany(
            { _id: { $in: productIds } },
            { 'inventory.quantity': data.stock }
          );
        } else {
          return res.status(400).json({ success: false, message: 'Stock value required' });
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({ success: true, modified: result.modifiedCount || result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newProduct = new Product({
      ...product.toObject(),
      _id: undefined,
      name: `${product.name} (Copie)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      createdAt: undefined,
      updatedAt: undefined,
      isActive: false
    });

    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantité valide requise' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const addedQuantity = parseInt(quantity);
    const currentQuantity = product.inventory?.quantity || 0;
    product.inventory.quantity = currentQuantity + addedQuantity;

    await product.save();
    res.json({ 
      success: true, 
      message: `Stock ajouté: ${addedQuantity}`,
      product: {
        _id: product._id,
        name: product.name,
        inventory: product.inventory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status, note } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Order IDs required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });

    for (const order of orders) {
      order.status = status;
      order.statusHistory.push({
        status,
        note: note || `Bulk update: ${status}`,
        updatedBy: req.user.id,
        timestamp: new Date()
      });
      if (status === 'SHIPPED') order.shipping.shippedAt = new Date();
      if (status === 'DELIVERED') {
        order.shipping.deliveredAt = new Date();
        order.payment.status = 'COMPLETED';
      }
      await order.save();
    }

    res.json({ success: true, updated: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addOrderNote = async (req, res) => {
  try {
    const { note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.internalNotes = order.internalNotes || [];
    order.internalNotes.push({
      text: note,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await order.save();
    res.json({ success: true, internalNotes: order.internalNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderNotes = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('internalNotes');
    res.json({ success: true, internalNotes: order?.internalNotes || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportUsers = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const users = await User.find().select('firstName lastName email phone role createdAt isActive lastLogin').sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({ success: true, users });
    }

    const separator = ';';
    const csvHeader = `Prénom${separator}Nom${separator}Email${separator}Téléphone${separator}Rôle${separator}Statut${separator}Inscription${separator}Dernière connexion\n`;
    const csvRows = users.map(u =>
      `${u.firstName}${separator}${u.lastName}${separator}${u.email}${separator}${u.phone || ''}${separator}${u.role}${separator}${u.isActive ? 'Actif' : 'Inactif'}${separator}${new Date(u.createdAt).toLocaleDateString('fr-TN')}${separator}${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-TN') : ''}`
    ).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=utilisateurs-${Date.now()}.csv`);
    res.send(bom + csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportOrders = async (req, res) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({ success: true, orders });
    }

    const separator = ';';
    const statusLabels = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En préparation',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée'
    };
    const paymentStatusLabels = {
      'PENDING': 'En attente',
      'COMPLETED': 'Payé',
      'FAILED': 'Échoué',
      'REFUNDED': 'Remboursé'
    };

    const csvHeader = `N° Commande${separator}Client${separator}Email${separator}Téléphone${separator}Total (DT)${separator}Statut${separator}Paiement${separator}Date\n`;
    const csvRows = orders.map(o => {
      const user = o.user || {};
      const customerName = o.guestName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
      return `${o.orderNumber}${separator}${customerName}${separator}${user.email || o.guestEmail || ''}${separator}${o.shippingAddress?.phone || o.guestPhone || ''}${separator}${(o.pricing?.total || 0).toFixed(3)}${separator}${statusLabels[o.status] || o.status}${separator}${paymentStatusLabels[o.payment?.status] || o.payment?.status || ''}${separator}${new Date(o.createdAt).toLocaleDateString('fr-TN')}`;
    }).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=commandes-${Date.now()}.csv`);
    res.send(bom + csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.printInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address addresses')
      .populate('items.product', 'name pricing images sku');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const invoice = {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.user ? {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone,
        address: order.shippingAddress
      } : {
        name: order.guestName || 'Guest',
        email: order.guestEmail,
        phone: order.guestPhone,
        address: order.shippingAddress
      },
      items: order.items.map(item => ({
        name: item.name || item.product?.name,
        sku: item.sku || item.product?.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      })),
      pricing: order.pricing,
      payment: order.payment,
      shipping: order.shipping
    };

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    const query = {};
    if (read !== undefined) query.isRead = read === 'true';

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Contact.countDocuments(query);
    const unreadCount = await Contact.countDocuments({ isRead: false });

    res.json({
      success: true,
      contacts,
      unreadCount,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markContactAsRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact non trouvé' });
    }
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllContactsAsRead = async (req, res) => {
  try {
    await Contact.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'Tous les messages marqués comme lus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact non trouvé' });
    }
    res.json({ success: true, message: 'Message supprimé' });
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