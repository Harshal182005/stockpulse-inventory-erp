const AuditLog = require('../models/AuditLog');

// @desc    Get audit trail logs
// @route   GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { search, module, action, page = 1, limit = 25 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { details: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }
    if (module) query.module = module;
    if (action) query.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
