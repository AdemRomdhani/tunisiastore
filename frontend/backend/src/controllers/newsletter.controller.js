const Newsletter = require('../models/Newsletter');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: 'Email already subscribed' });
      }
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = undefined;
      await existing.save();
      return res.json({ success: true, message: 'Re-subscribed successfully' });
    }
    
    const subscription = await Newsletter.create({ email: email.toLowerCase() });
    
    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    const newsletter = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (!newsletter) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }
    
    newsletter.isActive = false;
    newsletter.unsubscribedAt = new Date();
    await newsletter.save();
    
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const subscribers = await Newsletter.find({ isActive: true })
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Newsletter.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      subscribers,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }
    res.json({ success: true, message: 'Subscriber deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};