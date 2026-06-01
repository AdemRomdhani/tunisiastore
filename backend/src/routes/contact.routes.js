const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message
    });

    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendContactNotification(contact);
      await EmailService.sendContactConfirmation(contact);
    } catch (emailErr) {
      console.error('Contact confirmation email failed:', emailErr.message);
    }

    res.status(201).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', authenticate, authorize('admin', 'supervisor', 'moderator'), async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', authenticate, authorize('admin', 'supervisor', 'moderator'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;