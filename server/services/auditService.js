const AuditLog = require('../models/AuditLog');

const logActivity = async ({ user, action, module, details, oldValues, newValues, req }) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'System';

    await AuditLog.create({
      user: user?._id || user?.id,
      userName: user?.name || 'System User',
      userRole: user?.role || 'admin',
      action,
      module,
      details,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit Log Error:', error.message);
  }
};

module.exports = { logActivity };
