import { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');

  const token = localStorage.getItem('token');
  let user;
  try {
    user = jwtDecode(token);
  } catch {
    user = null;
  }

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || user.role !== 'admin') {
        setError('Access denied: Admins only');
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/orders/admin/all-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching all orders:', err);
        setError('Failed to fetch orders');
      }
    };

    fetchOrders();
  }, [user, token]);

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setEstimatedDeliveryDate(order.estimatedDeliveryDate?.split('T')[0] || '');
  };

  const handleUpdateOrder = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/admin/update/${editingOrder._id}`,
        { status, trackingNumber, estimatedDeliveryDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order updated');
      setEditingOrder(null);
      // Refresh orders
      const res = await axios.get('http://localhost:5000/api/orders/admin/all-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order');
    }
  };

  return (
    <div>
      <h2>All Orders (Admin)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '15px',
              background: editingOrder?._id === order._id ? '#eef' : '#fff'
            }}
          >
            <p><strong>User:</strong> {order.userId?.email || 'Unknown'}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}</p>
            <p><strong>Estimated Delivery:</strong> 
              {order.estimatedDeliveryDate
                ? new Date(order.estimatedDeliveryDate).toLocaleDateString()
                : 'N/A'}
            </p>
            <p><strong>Total:</strong> ${order.totalAmount?.toFixed(2)}</p>

            <h4>Items:</h4>
            {order.products?.map((item, idx) => (
              <div key={idx} style={{ marginLeft: '20px' }}>
                <p>{item.name} — ${item.price?.toFixed(2)} × {item.quantity}</p>
              </div>
            ))}

            <button onClick={() => handleEditClick(order)} style={{ marginTop: '10px' }}>
              Edit Order
            </button>
          </div>
        ))
      )}

      {editingOrder && (
        <div style={{ border: '1px solid #007bff', padding: '15px', marginTop: '30px', background: '#f4faff' }}>
          <h3>Update Order #{editingOrder._id}</h3>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginLeft: '10px' }}>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <br /><br />

          <label>Tracking Number:</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            style={{ marginLeft: '10px', width: '50%' }}
          />
          <br /><br />

          <label>Estimated Delivery:</label>
          <input
            type="date"
            value={estimatedDeliveryDate}
            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
          <br /><br />

          <button onClick={handleUpdateOrder} style={{ padding: '8px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none' }}>
            Save Changes
          </button>
          <button onClick={() => setEditingOrder(null)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
