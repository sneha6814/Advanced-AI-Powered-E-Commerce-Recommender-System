const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/recommendations', require('./routes/recommendRoutes'));
app.use('/api/frequent', require('./routes/frequentRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
