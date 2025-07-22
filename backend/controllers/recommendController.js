const { spawn } = require('child_process');
const path      = require('path');
const Product   = require('../models/Product');

exports.getRecommendations = (req, res) => {
  const userId = req.user.id;
  const script = path.join(__dirname, '..', 'recommend.py');


  const py = spawn('python', [script, userId]);

  let out = '';
  let err = '';

  py.stdout.on('data', d => (out += d));
  py.stderr.on('data', d => (err += d));

  py.on('close', async code => {
    if (code !== 0 || err) {
      console.error('[Recommender] Python stderr:', err);
      return res.status(500).json({ error: 'Recommender failed', details: err });
    }

    let ids;
    try {
      const parsed = JSON.parse(out.trim());
      // ⇣ the script returns an array, not an object
      ids = Array.isArray(parsed) ? parsed : parsed.recommendations || [];
    } catch (e) {
      console.error('[Recommender] Invalid JSON from Python:', out);
      return res.status(500).json({ error: 'Invalid recommender output' });
    }

    if (ids.length === 0) {
      console.log('[Recommender] No recommendations for this user.');
      return res.json([]);
    }

    try {
      const products = await Product.find({ _id: { $in: ids } });

      // preserve original ID order
      const ordered = ids
        .map(id => products.find(p => p && p._id.equals(id)))
        .filter(Boolean);

      return res.json(ordered);
    } catch (dbErr) {
      console.error('[Recommender] DB fetch error:', dbErr);
      res.status(500).json({ error: 'DB fetch failed' });
    }
  });
};
