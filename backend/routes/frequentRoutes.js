const express = require('express');
const router = express.Router();
const { getFrequentlyBoughtTogether } = require('../controllers/frequentRecommender');

// GET /api/frequent/:productId
router.get('/:productId', getFrequentlyBoughtTogether);

module.exports = router;
