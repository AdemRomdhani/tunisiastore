const Contact = require('../../models/Contact');

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
