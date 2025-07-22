import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useContext } from 'react';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './components/ProductList';
import OrderHistory from './components/OrderHistory';
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
import ProductDetailPage from './components/ProductDetailPage';
import Cart from './pages/Cart';
import { AuthContext } from './context/AuthContext';
import Chatbot from './components/Chatbot'; // ✅ Import Chatbot component
import ManageProducts from './components/ManageProducts';
import './App.css';

function App() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/">Home</Link> {' '}
        {!user && <Link to="/register">Register</Link>} {' '}
        {!user && <Link to="/login">Login</Link>} {' '}
        {user && <Link to="/products">Products</Link>} {' '}
        {user?.role === 'user' && <Link to="/cart">Cart</Link>} {' '}
        {user?.role === 'user' && <Link to="/orders">My Orders</Link>} {' '}
        {user?.role === 'admin' && <Link to="/admin">Manage products</Link>} {' '}
        {user?.role === 'admin' && <Link to="/admin/orders">All Orders</Link>} {' '}
        {user?.role === 'admin' && <Link to="/admin/dashboard">Dashboard</Link>}
        {user && (
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>
            Logout
          </button>
        )}
      </nav>

      <div style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />

          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ManageProducts />
              </ProtectedRoute>
            }
          />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

        </Routes>
      </div>

      <Chatbot /> {/* ✅ Chatbot component floats on all pages */}
    </Router>
  );
}

export default App;
