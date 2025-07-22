const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/recommendations/user
// We do not pass userId in URL, it’s from JWT
router.get('/user', authMiddleware, getRecommendations);

module.exports = router;
