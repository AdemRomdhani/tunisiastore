const Address = require('../models/Address');

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { fullName, phone, governorate, city, streetAddress, postalCode, additionalInfo, isDefault, label } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      fullName,
      phone,
      governorate,
      city,
      streetAddress,
      postalCode,
      additionalInfo,
      isDefault: isDefault || false,
      label: label || 'OTHER'
    });

    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { fullName, phone, governorate, city, streetAddress, postalCode, additionalInfo, isDefault, label } = req.body;

    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user.id, _id: { $ne: address._id } }, { isDefault: false });
    }

    Object.assign(address, {
      fullName,
      phone,
      governorate,
      city,
      streetAddress,
      postalCode,
      additionalInfo,
      isDefault: isDefault ?? address.isDefault,
      label: label || address.label
    });

    await address.save();
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    // Unset all defaults
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    
    // Set new default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};