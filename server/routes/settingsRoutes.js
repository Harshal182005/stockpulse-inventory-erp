const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getSettings)
  .put(protect, authorize('admin'), updateSettings);

module.exports = router;
