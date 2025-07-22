const express = require('express');
const router = express.Router();
const { getAdminOverview, getSalesData } = require('../controllers/adminController');

// GET /api/admin/overview
router.get('/overview', getAdminOverview);

// GET /api/admin/sales
router.get('/sales', getSalesData);

module.exports = router;
