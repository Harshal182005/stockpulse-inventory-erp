const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

/**
 * Helper to compute date range filter based on period
 */
const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last7days':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last30days':
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// @desc    Get complete Admin Dashboard stats and charts
// @route   GET /api/reports/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run parallel counts & base queries
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      products,
      salesInPeriod,
      purchasesInPeriod,
      expensesInPeriod,
      todaySalesDocs,
      thisMonthSalesDocs,
    ] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Category.countDocuments(),
      Supplier.countDocuments(),
      Customer.countDocuments(),
      Product.find({ status: 'active' }).populate('category', 'name'),
      Sale.find({ createdAt: { $gte: start, $lte: end }, saleStatus: 'completed' }),
      Purchase.find({ createdAt: { $gte: start, $lte: end } }),
      Expense.find({ date: { $gte: start, $lte: end } }),
      Sale.find({ createdAt: { $gte: todayStart }, saleStatus: 'completed' }),
      Sale.find({ createdAt: { $gte: thisMonthStart }, saleStatus: 'completed' }),
    ]);

    // Inventory status metrics
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const categoryStockMap = {};

    products.forEach((p) => {
      const stock = p.currentStock || 0;
      totalStockValue += stock * (p.sellingPrice || 0);

      const catName = p.category?.name || 'General';
      categoryStockMap[catName] = (categoryStockMap[catName] || 0) + stock;

      if (stock === 0) outOfStockCount++;
      else if (stock <= p.minStock) lowStockCount++;

      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        if (exp < now) expiredCount++;
        else if (exp <= next30Days) expiringCount++;
      }
    });

    // Sales metrics
    const todaySales = todaySalesDocs.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const monthlySales = thisMonthSalesDocs.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const periodRevenue = salesInPeriod.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const periodPurchases = purchasesInPeriod.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
    const periodExpenses = expensesInPeriod.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Calculate COGS (Cost of Goods Sold) for completed sales
    let periodCOGS = 0;
    const productSoldMap = {};

    salesInPeriod.forEach((s) => {
      s.items.forEach((item) => {
        periodCOGS += (item.purchaseCost || 0) * (item.quantity || 1);
        const pid = item.productName || 'Unknown';
        productSoldMap[pid] = (productSoldMap[pid] || 0) + item.quantity;
      });
    });

    const grossProfit = periodRevenue - periodCOGS;
    const netProfit = grossProfit - periodExpenses;

    // Pending payments from customers
    const unpaidSales = await Sale.find({ paymentStatus: { $in: ['pending', 'partial'] } });
    const pendingPayments = unpaidSales.reduce((acc, s) => acc + (s.grandTotal - (s.paidAmount || 0)), 0);

    // Top Selling Products
    const topSellingProducts = Object.entries(productSoldMap)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Low stock items preview
    const lowStockPreview = products
      .filter((p) => p.currentStock <= p.minStock)
      .slice(0, 6)
      .map((p) => ({
        name: p.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
        reorderLevel: p.reorderLevel,
      }));

    // Payment method distribution
    const paymentMethodMap = {};
    salesInPeriod.forEach((s) => {
      const pm = s.paymentMethod ? s.paymentMethod.toUpperCase() : 'CASH';
      paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + (s.grandTotal || 0);
    });
    const paymentMethodData = Object.entries(paymentMethodMap).map(([name, value]) => ({ name, value }));

    // Category stock distribution chart data
    const categoryStockData = Object.entries(categoryStockMap).map(([name, stock]) => ({ name, stock }));

    // Monthly revenue & profit breakdown (Past 6 months trend)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = mDate.toLocaleString('default', { month: 'short' });

      // Count sales in this month
      const mSales = await Sale.find({ createdAt: { $gte: mDate, $lte: mEnd }, saleStatus: 'completed' });
      const mPurchases = await Purchase.find({ createdAt: { $gte: mDate, $lte: mEnd } });
      const mExpenses = await Expense.find({ date: { $gte: mDate, $lte: mEnd } });

      const rev = mSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
      const pur = mPurchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
      const exp = mExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      let cogs = 0;
      mSales.forEach((s) => {
        s.items.forEach((item) => {
          cogs += (item.purchaseCost || 0) * (item.quantity || 1);
        });
      });

      monthlyTrends.push({
        month: monthName,
        revenue: rev,
        purchases: pur,
        expenses: exp,
        grossProfit: rev - cogs,
        netProfit: rev - cogs - exp,
      });
    }

    res.json({
      success: true,
      kpis: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalCustomers,
        totalStockValue,
        todaySales,
        monthlySales,
        periodRevenue,
        totalPurchases: periodPurchases,
        grossProfit,
        netProfit,
        periodExpenses,
        pendingPayments,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        expiringProducts: expiringCount,
        expiredProducts: expiredCount,
      },
      charts: {
        monthlyTrends,
        topSellingProducts,
        categoryStockData,
        paymentMethodData,
        lowStockPreview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed Sales Report
// @route   GET /api/reports/sales
const getSalesReport = async (req, res, next) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      saleStatus: 'completed',
    }).populate('customer', 'name phone email');

    // Aggregate by product
    const productStats = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const id = item.product?.toString() || item.sku;
        if (!productStats[id]) {
          productStats[id] = {
            sku: item.sku,
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productStats[id].quantity += item.quantity;
        productStats[id].revenue += item.subtotal;
        productStats[id].profit += item.subtotal - (item.purchaseCost || 0) * item.quantity;
      });
    });

    const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalOrders = sales.length;

    res.json({
      success: true,
      data: {
        period: { start, end },
        totalOrders,
        totalRevenue,
        productBreakdown: Object.values(productStats).sort((a, b) => b.revenue - a.revenue),
        sales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed Profit & Loss Report
// @route   GET /api/reports/profit-loss
const getProfitLossReport = async (req, res, next) => {
  try {
    const { period = 'thisMonth', startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const [sales, purchases, expenses] = await Promise.all([
      Sale.find({ createdAt: { $gte: start, $lte: end }, saleStatus: 'completed' }),
      Purchase.find({ createdAt: { $gte: start, $lte: end } }),
      Expense.find({ date: { $gte: start, $lte: end } }),
    ]);

    const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);

    let cogs = 0;
    sales.forEach((s) => {
      s.items.forEach((item) => {
        cogs += (item.purchaseCost || 0) * item.quantity;
      });
    });

    const grossProfit = totalRevenue - cogs;
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Categorized operating expenses
    const expenseBreakdown = {};
    let totalExpenses = 0;
    expenses.forEach((e) => {
      totalExpenses += e.amount;
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalRevenue,
          cogs,
          grossProfit,
          grossMargin: `${grossMargin}%`,
          totalExpenses,
          netProfit,
          netMargin: `${netMargin}%`,
        },
        expenseBreakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({ category, amount })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getProfitLossReport,
};
