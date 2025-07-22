import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const AdminDashboard = () => {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [overviewRes, salesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/overview'),
          axios.get('http://localhost:5000/api/admin/sales?days=7')
        ]);
        setOverview(overviewRes.data);
        setSalesData(salesRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const chartData = {
    labels: salesData.map(item => item._id), // _id expected as date string
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map(item => item.total), // total is the revenue per day
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'teal',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-100 p-5 rounded-lg text-center shadow-md">
          <h3 className="text-lg font-semibold">Users</h3>
          <p className="text-2xl font-bold">{overview.totalUsers}</p>
        </div>
        <div className="bg-gray-100 p-5 rounded-lg text-center shadow-md">
          <h3 className="text-lg font-semibold">Orders</h3>
          <p className="text-2xl font-bold">{overview.totalOrders}</p>
        </div>
        <div className="bg-gray-100 p-5 rounded-lg text-center shadow-md">
          <h3 className="text-lg font-semibold">Products</h3>
          <p className="text-2xl font-bold">{overview.totalProducts}</p>
        </div>
        <div className="bg-gray-100 p-5 rounded-lg text-center shadow-md">
          <h3 className="text-lg font-semibold">Revenue</h3>
          <p className="text-2xl font-bold">${overview.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Sales (Last 7 Days)</h3>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default AdminDashboard;
