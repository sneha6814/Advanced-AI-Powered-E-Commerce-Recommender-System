const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * GET /api/frequent/:productId
 * Returns up to 5 products frequently bought with :productId.
 */
exports.getFrequentlyBoughtTogether = async (req, res) => {
  const { productId } = req.params;

  // Validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: 'Invalid productId format' });
  }

  const pid = new mongoose.Types.ObjectId(productId);

  try {
    // 1. Find all orders containing this product
    const orders = await Order.find({ 'products.productId': pid });

    // 2. Count co-purchased product IDs
    const coPurchaseCounts = {};
    for (const order of orders) {
      for (const item of order.products) {
        const otherId = item.productId;

        if (otherId && otherId.toString() !== productId) {
          const idStr = otherId.toString();
          coPurchaseCounts[idStr] = (coPurchaseCounts[idStr] || 0) + 1;
        }
      }
    }

    // 3. Top 5 most co-purchased product IDs
    let topIds = Object.entries(coPurchaseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => new mongoose.Types.ObjectId(id));

    // 4. Fallback: global best-sellers (excluding current product)
    if (topIds.length === 0) {
      const fallback = await Order.aggregate([
        { $unwind: '$products' },
        { $match: { 'products.productId': { $ne: pid } } },
        { $group: { _id: '$products.productId', count: { $sum: '$products.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      topIds = fallback.map(item => item._id);
    }

    // 5. Fetch the full product documents
    const products = await Product.find({ _id: { $in: topIds } });

    // 6. Return results in same order as topIds
    const ordered = topIds
      .map(id => products.find(p => p._id.equals(id)))
      .filter(Boolean);

    res.json(ordered);
  } catch (err) {
    console.error('Frequently‑bought error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
