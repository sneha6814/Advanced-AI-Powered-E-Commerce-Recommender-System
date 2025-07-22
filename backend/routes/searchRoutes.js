const express = require('express');
const router = express.Router();
const { combinedSearch } = require('../controllers/searchController');

router.get('/', combinedSearch);
module.exports = router;
