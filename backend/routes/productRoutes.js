const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');


// routes/productRoutes.js (ensure this is ABOVE router.get('/:id'))
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing query parameter' });
    }

    let filter = {};
    let keyword = query;
    let priceFilter = {};

    // Match patterns
    const underMatch = query.match(/under\s*(\d+)/i);
    const aboveMatch = query.match(/above\s*(\d+)/i);
    const betweenMatch = query.match(/between\s*(\d+)\s*and\s*(\d+)/i);

    if (underMatch) {
      priceFilter = { $lte: parseFloat(underMatch[1]) };
      keyword = query.replace(/under\s*\d+/i, '').trim();
    } else if (aboveMatch) {
      priceFilter = { $gte: parseFloat(aboveMatch[1]) };
      keyword = query.replace(/above\s*\d+/i, '').trim();
    } else if (betweenMatch) {
      const min = parseFloat(betweenMatch[1]);
      const max = parseFloat(betweenMatch[2]);
      priceFilter = { $gte: min, $lte: max };
      keyword = query.replace(/between\s*\d+\s*and\s*\d+/i, '').trim();
    }

    const keywordRegex = new RegExp(keyword, 'i');

    if (keyword) {
      filter.$or = [
        { name: keywordRegex },
        { brand: keywordRegex },
        { category: keywordRegex },
        { subcategory: keywordRegex },
      ];
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Other routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
