const User = require('../models/User');
const Role = require('../models/Role');
const { logActivity } = require('../services/auditService');

// @desc    Get all users
// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user by admin
// @route   POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'TempPass@123',
      role: role || 'staff',
      phone: phone || '',
    });

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'User',
      details: `Created new user ${user.name} (${user.email}) as ${user.role}`,
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, role, phone, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    await user.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'User',
      details: `Updated user: ${user.name} (${user.email})`,
      req,
    });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await user.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'User',
      details: `Deleted user: ${user.name} (${user.email})`,
      req,
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all roles with permissions
// @route   GET /api/users/roles
const getRoles = async (req, res, next) => {
  try {
    let roles = await Role.find();
    if (roles.length === 0) {
      // Create defaults
      const defaultModules = ['Products', 'Categories', 'Brands', 'Suppliers', 'Customers', 'Purchases', 'Sales', 'Inventory', 'Expenses', 'Reports', 'Settings', 'Users'];
      const defaultRoles = [
        {
          name: 'admin',
          description: 'Full administrative access to all modules and configurations',
          permissions: defaultModules.map((m) => ({ module: m, view: true, create: true, edit: true, delete: true, export: true, approve: true })),
        },
        {
          name: 'manager',
          description: 'Operational management across inventory, purchases, sales and reports',
          permissions: defaultModules.map((m) => ({
            module: m,
            view: true,
            create: !['Users', 'Settings'].includes(m),
            edit: !['Users', 'Settings'].includes(m),
            delete: !['Users', 'Settings'].includes(m),
            export: true,
            approve: true,
          })),
        },
        {
          name: 'staff',
          description: 'Front-desk point of sale, billing, and customer operations',
          permissions: defaultModules.map((m) => ({
            module: m,
            view: ['Products', 'Sales', 'Customers', 'Inventory'].includes(m),
            create: ['Sales', 'Customers'].includes(m),
            edit: false,
            delete: false,
            export: false,
            approve: false,
          })),
        },
        {
          name: 'accountant',
          description: 'Financial ledger, billing receipts, expenses, and fiscal reporting',
          permissions: defaultModules.map((m) => ({
            module: m,
            view: ['Sales', 'Purchases', 'Expenses', 'Reports'].includes(m),
            create: ['Expenses'].includes(m),
            edit: ['Expenses'].includes(m),
            delete: false,
            export: true,
            approve: false,
          })),
        },
      ];
      roles = await Role.insertMany(defaultRoles);
    }
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// @desc    Update role permissions
// @route   PUT /api/users/roles/:id
const updateRolePermissions = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Role',
      details: `Updated permissions for role: ${role.name}`,
      req,
    });

    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  updateRolePermissions,
};
