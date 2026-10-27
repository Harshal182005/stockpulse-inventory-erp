const express = require('express');
const router = express.Router();
const {
  getForecast,
  getPredictions,
  getRecommendations,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/demand', protect, getForecast);
router.get('/predictions', protect, getPredictions);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
