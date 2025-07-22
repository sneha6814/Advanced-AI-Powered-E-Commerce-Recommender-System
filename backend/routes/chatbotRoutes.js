const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helpers
const extractMaxPrice = (text) => {
  const regex = /\b(?:under|below|less than|up to|max(?:imum)?)\s*\$?(\d+(\.\d{1,2})?)/i;
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : null;
};

const extractMinPrice = (text) => {
  const regex = /\b(?:above|over|greater than|more than|min(?:imum)?)\s*\$?(\d+(\.\d{1,2})?)/i;
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : null;
};

const extractKeywords = (text) => {
  const categories = ['watch', 'bag', 'sunglasses', 'bracelet', 'shoes'];
  const lower = text.toLowerCase();
  return categories.filter(cat => lower.includes(cat));
};

const isTrackingQuery = (text) => {
  const keywords = ['track', 'tracking', 'order status', 'where is my order', 'order update', 'my order'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
};

const extractEmail = (text) => {
  const match = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return match ? match[0] : null;
};

const runSemanticSearch = (query) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'semantic_search.py');
    const python = spawn('python', [scriptPath, query]);

    let data = '';
    let error = '';

    python.stdout.on('data', chunk => data += chunk.toString());
    python.stderr.on('data', chunk => error += chunk.toString());

    python.on('close', (code) => {
      if (code === 0 && data.trim()) {
        try {
          const ids = JSON.parse(data);
          resolve(ids);
        } catch (err) {
          reject('Failed to parse semantic search result');
        }
      } else {
        reject(error || 'Semantic search failed');
      }
    });
  });
};

// 📦 Chatbot endpoint
router.post('/', async (req, res) => {
  let { message, userEmail } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // 🔁 ORDER CANCELLATION
    if (/cancel order\s+(\w+).*?([\w.+-]+@[\w.-]+\.\w+)/i.test(message)) {
      const [, orderId, email] = message.match(/cancel order\s+(\w+).*?([\w.+-]+@[\w.-]+\.\w+)/i);
      try {
        const cancelRes = await axios.post('http://localhost:5000/api/orders/cancel', {
          orderId,
          email
        });
        return res.json({ reply: cancelRes.data.message, products: [] });
      } catch (err) {
        console.error('❌ Cancel Order error:', err?.response?.data || err);
        return res.json({ reply: 'Failed to cancel order. Please check your details and try again.', products: [] });
      }
    }

    if (/cancel.*order/i.test(message)) {
      return res.json({
        reply: 'Please provide your email and order ID to cancel (e.g. "Cancel order 66abc123 for john@example.com").',
        products: []
      });
    }

    // 📦 ORDER TRACKING
    if (isTrackingQuery(message)) {
      if (!userEmail) {
        const extractedEmail = extractEmail(message);
        if (extractedEmail) {
          userEmail = extractedEmail;
        } else {
          return res.json({
            reply: 'To track your order, please provide your email address.',
            products: []
          });
        }
      }

      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        return res.json({ reply: `No user found with email: ${userEmail}`, products: [] });
      }

      const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

      if (!orders.length) {
        return res.json({ reply: `No orders found for email: ${userEmail}.`, products: [] });
      }

      const summary = orders.map(o =>
        `Order #${o._id.toString().slice(-6)}: Status - ${o.status}, Tracking Number - ${o.trackingNumber || 'N/A'}, Estimated Delivery - ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleDateString() : 'N/A'}`
      ).join('\n');

      return res.json({ reply: `Here are your recent orders:\n${summary}`, products: [] });
    }

    // 🛍️ PRODUCT SEARCH
    const maxPrice = extractMaxPrice(message);
    const minPrice = extractMinPrice(message);
    const keywords = extractKeywords(message);

    const ids = await runSemanticSearch(message);
    let products = await Product.find({ _id: { $in: ids } });

    if (keywords.length > 0) {
      products = products.filter(p =>
        keywords.some(k =>
          p.name?.toLowerCase().includes(k) ||
          p.category?.toLowerCase().includes(k) ||
          p.description?.toLowerCase().includes(k)
        )
      );
    }

    if (minPrice !== null) {
      products = products.filter(p => p.price !== undefined && p.price >= minPrice);
    }
    if (maxPrice !== null) {
      products = products.filter(p => p.price !== undefined && p.price <= maxPrice);
    }

    if (minPrice !== null || maxPrice !== null || keywords.length > 0) {
      const priceQuery = {};
      if (minPrice !== null) priceQuery.$gte = minPrice;
      if (maxPrice !== null) priceQuery.$lte = maxPrice;

      const extraProducts = await Product.find({
        ...(Object.keys(priceQuery).length ? { price: priceQuery } : {}),
        ...(keywords.length ? {
          $or: keywords.flatMap(k => [
            { name: new RegExp(k, 'i') },
            { category: new RegExp(k, 'i') },
            { description: new RegExp(k, 'i') }
          ])
        } : {}),
        _id: { $nin: ids },
      });

      products = products.concat(extraProducts);
    }

    const ranked = ids.map(id => products.find(p => p._id.toString() === id)).filter(Boolean);
    const extras = products.filter(p => !ids.includes(p._id.toString()));
    const finalList = [...ranked, ...extras];

    if (!finalList.length) {
      return res.json({ reply: 'No matching products found.', products: [] });
    }

    const topSummaries = finalList.slice(0, 5).map(p =>
      `• ${p.name} - $${p.price} (${p.brand || 'No brand'})`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant. ONLY recommend products listed below. Never invent products or prices.`
        },
        {
          role: 'user',
          content: `User asked: "${message}"\nAvailable products:\n${topSummaries}\nOnly mention products that match the user's criteria.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const reply = completion.choices[0].message.content;

    const simplified = finalList.slice(0, 5).map(p => ({
      _id: p._id,
      name: p.name,
      image: p.image,
      price: p.price
    }));

    res.json({ reply, products: simplified });

  } catch (err) {
    console.error('❌ Chatbot error:', err);
    res.status(500).json({ error: 'Chatbot failed to respond' });
  }
});

module.exports = router;
