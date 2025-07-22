const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const moment = require('moment');


// Get admin dashboard overview: counts + total revenue
const getAdminOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get sales data for last `days` days (default 7)
const getSalesData = async (req, res) => {
  try {
    const today = moment().endOf('day').toDate();
    const sevenDaysAgo = moment().subtract(6, 'days').startOf('day').toDate();

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: sevenDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing days with 0
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, 'days');
      const formattedDate = day.format('YYYY-MM-DD');
      const dayLabel = day.format('ddd'); // e.g., Mon, Tue

      const daySale = sales.find(s => s._id === formattedDate);
      result.push({ day: dayLabel, total: daySale ? daySale.total : 0 });
    }

    res.json(result);
  } catch (err) {
    console.error("Sales Stats Error:", err);
    res.status(500).json({ error: 'Failed to fetch sales stats' });
  }
};
module.exports = {
  getAdminOverview,
  getSalesData,
};
