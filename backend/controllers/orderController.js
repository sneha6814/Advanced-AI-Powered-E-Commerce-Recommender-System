const Order = require('../models/Order');
const User = require('../models/User'); // Make sure User model is imported

// Utility: Generate a tracking number
const generateTrackingNumber = () => {
  const prefix = 'TRK';
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
};

// Create Order
const createOrder = async (req, res) => {
  try {
    const { cart, total } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Estimate delivery: 7 days from now
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = new Order({
      userId: req.user.id,
      products: cart.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        brand: item.brand || 'No brand',
      })),
      totalAmount: total,
      trackingNumber: generateTrackingNumber(),
      status: 'Pending',
      estimatedDeliveryDate: estimatedDelivery,
      statusHistory: [{ status: 'Pending', date: new Date() }],
    });

    await order.save();
    res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    console.error('CreateOrder error:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
};

// Get Orders for Logged-in User
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Admin: Get All Orders
const getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
};

// Admin: Update Order
const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDeliveryDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status && order.status !== status) {
      order.status = status;
      order.statusHistory.push({ status, date: new Date() });

      if (status === 'Shipped' && !order.estimatedDeliveryDate) {
        const delivery = new Date();
        delivery.setDate(delivery.getDate() + 5);
        order.estimatedDeliveryDate = delivery;
      }
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    }

    await order.save();
    res.json({ message: 'Order updated', order });
  } catch (err) {
    console.error('UpdateOrder error:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

// Cancel Order (user authenticated, cancels own order)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or you are not authorized' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    order.status = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', date: new Date() });
    await order.save();

    res.json({ message: `Order ${orderId} has been cancelled.` });
  } catch (err) {
    console.error('CancelOrder error:', err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Admin: Get Total Revenue
const getRevenue = async (_req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    res.json({ revenue: totalRevenue.toFixed(2) });
  } catch (err) {
    console.error('GetRevenue error:', err);
    res.status(500).json({ message: 'Failed to fetch revenue' });
  }
};


module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrder,
  cancelOrder,
  getRevenue,
};
