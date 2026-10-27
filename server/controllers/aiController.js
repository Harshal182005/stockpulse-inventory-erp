const {
  getLowStockPredictions,
  getDemandForecast,
  getSmartRecommendations,
} = require('../services/aiService');

// @desc    Get AI Demand Forecast
// @route   GET /api/forecast
const getForecast = async (req, res, next) => {
  try {
    const forecast = await getDemandForecast();
    res.json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Smart Low-Stock Runout Predictions
// @route   GET /api/forecast/predictions
const getPredictions = async (req, res, next) => {
  try {
    const predictions = await getLowStockPredictions();
    res.json({ success: true, count: predictions.length, data: predictions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Prioritized Recommendations
// @route   GET /api/forecast/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getSmartRecommendations();
    res.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getForecast,
  getPredictions,
  getRecommendations,
};
