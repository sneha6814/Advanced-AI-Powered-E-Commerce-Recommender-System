const express = require('express');
const router  = express.Router();
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { createOrder, getUserOrders, getAllOrders, updateOrder , cancelOrder, getRevenue  } = require('../controllers/orderController');

// POST /api/orders         – logged-in user places order
router.post('/', authMiddleware, createOrder);

// GET  /api/orders/my-orders          – user order history
router.get('/my-orders', authMiddleware, getUserOrders);

// GET  /api/orders/admin/all-orders   – admin overview
router.get('/admin/all-orders', authMiddleware, isAdmin, getAllOrders);

// PUT  /api/orders/admin/update/:orderId – admin updates order
router.put('/admin/update/:orderId', authMiddleware, isAdmin, updateOrder);

router.put('/cancel/:orderId', authMiddleware, cancelOrder);

module.exports = router;
