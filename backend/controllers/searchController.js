const Product = require('../models/Product');
const { spawn } = require('child_process');
const path = require('path');

// Extract min and max price filters from query
function extractPriceFilter(query) {
  const maxPriceRegex = /\b(?:under|below|less than|up to)\s*\$?(\d+(?:\.\d{1,2})?)/i;
  const minPriceRegex = /\b(?:above|over|more than|greater than)\s*\$?(\d+(?:\.\d{1,2})?)/i;

  let maxPrice = null;
  let minPrice = null;

  const maxMatch = query.match(maxPriceRegex);
  if (maxMatch) maxPrice = parseFloat(maxMatch[1]);

  const minMatch = query.match(minPriceRegex);
  if (minMatch) minPrice = parseFloat(minMatch[1]);

  return { minPrice, maxPrice };
}

exports.combinedSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') return res.json([]);

    console.log('🔍 Search query received:', query);

    // Extract price filters if any
    const { minPrice, maxPrice } = extractPriceFilter(query);
    if (minPrice !== null) console.log(`⬆️ Min price filter detected: >= ${minPrice}`);
    if (maxPrice !== null) console.log(`⬇️ Max price filter detected: <= ${maxPrice}`);

    // --- 1. Run semantic_search.py ---
    const scriptPath = path.join(__dirname, '..', 'semantic_search.py');
    const python = spawn('python', [scriptPath, query]);

    let data = '';
    let error = '';

    python.stdout.on('data', chunk => {
      data += chunk.toString();
    });

    python.stderr.on('data', chunk => {
      error += chunk.toString();
    });

    python.on('close', async (code) => {
      console.log(`🧠 Python process exited with code ${code}`);

      if (error) {
        console.error('🐍 Python stderr:', error);
      }

      if (code === 0 && data.trim()) {
        try {
          const ids = JSON.parse(data);
          if (Array.isArray(ids) && ids.length > 0) {
            let products = await Product.find({ _id: { $in: ids } });

            // Filter by min/max price if applicable
            if (minPrice !== null) {
              products = products.filter(p => p.price !== undefined && p.price >= minPrice);
            }
            if (maxPrice !== null) {
              products = products.filter(p => p.price !== undefined && p.price <= maxPrice);
            }

            // Preserve semantic ranking order after filtering
            const ranked = ids
              .map(id => products.find(p => p._id.toString() === id))
              .filter(Boolean);

            console.log('✅ Returning semantic results:', ranked.length);
            return res.json(ranked);
          }
        } catch (err) {
          console.error('❌ Semantic result JSON parse error:', err.message);
        }
      }

      // --- 2. Fallback: Keyword-based MongoDB search ---
      console.warn('⚠️ Semantic search failed or returned empty. Falling back to keyword search.');

      let keywordQuery = {
        $or: [
          { name: new RegExp(query, 'i') },
          { brand: new RegExp(query, 'i') },
          { category: new RegExp(query, 'i') },
          { description: new RegExp(query, 'i') },
        ],
      };

      // Add price filter for fallback
      const priceFilter = {};
      if (minPrice !== null) priceFilter.$gte = minPrice;
      if (maxPrice !== null) priceFilter.$lte = maxPrice;

      if (Object.keys(priceFilter).length > 0) {
        keywordQuery.price = priceFilter;
      }

      const keywordResults = await Product.find(keywordQuery);

      console.log('🔎 Returning keyword results:', keywordResults.length);
      res.json(keywordResults);
    });
  } catch (err) {
    console.error('🚨 Combined search controller failed:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
};
