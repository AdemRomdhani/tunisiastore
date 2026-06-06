const User = require('../../models/User');
const Order = require('../../models/Order');

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
