import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function OrderHistory() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching order history:', err);
        setError('Failed to fetch order history.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/orders/cancel/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);

      // Update local order state
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: 'Cancelled', statusHistory: [...order.statusHistory, { status: 'Cancelled', date: new Date() }] } : order
        )
      );
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order. Please try again.');
    }
  };

  if (loading) return <p>Loading your orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (orders.length === 0) return <p>You have no orders yet.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Your Order History</h2>
      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '5px',
            background: '#f9f9f9',
          }}
        >
          <p>
            <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}
          </p>
          <p>
            <strong>Estimated Delivery:</strong>{' '}
            {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'N/A'}
          </p>
          <p>
            <strong>Total:</strong> ${order.totalAmount?.toFixed(2)}
          </p>

          <h4>Items:</h4>
          {order.products.length > 0 ? (
            order.products.map((item, idx) => (
              <div key={idx} style={{ marginLeft: '20px', marginBottom: '8px' }}>
                <p>
                  <strong>{item.brand}</strong>
                </p>
                <p>
                  {item.name || 'Unnamed Item'} — ${item.price?.toFixed(2)} × {item.quantity}
                </p>
              </div>
            ))
          ) : (
            <p>No items found in this order.</p>
          )}

          <h5>Status History:</h5>
          {order.statusHistory && order.statusHistory.length > 0 ? (
            <ul style={{ marginLeft: '20px' }}>
              {order.statusHistory.map((h, i) => (
                <li key={i}>
                  {h.status} at {new Date(h.date).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No status history available.</p>
          )}

          {(order.status !== 'Cancelled' && order.status !== 'Delivered') && (
            <button
              onClick={() => cancelOrder(order._id)}
              style={{
                backgroundColor: '#d9534f',
                color: 'white',
                padding: '8px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Cancel Order
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default OrderHistory;
