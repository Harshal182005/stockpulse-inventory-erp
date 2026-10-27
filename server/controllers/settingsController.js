const Settings = require('../models/Settings');
const { logActivity } = require('../services/auditService');

// @desc    Get system settings
// @route   GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      if (req.body.business) settings.business = { ...settings.business.toObject(), ...req.body.business };
      if (req.body.invoice) settings.invoice = { ...settings.invoice.toObject(), ...req.body.invoice };
      if (req.body.notification) settings.notification = { ...settings.notification.toObject(), ...req.body.notification };
      await settings.save();
    }

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Settings',
      details: 'Updated global system settings & configurations',
      req,
    });

    res.json({ success: true, message: 'Settings saved successfully', data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
