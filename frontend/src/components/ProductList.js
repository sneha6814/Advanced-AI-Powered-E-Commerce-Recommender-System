import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import SearchBar from './SearchBar';
import Recommendations from './Recommendations';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  const { addToCart } = useContext(CartContext);
  const navigate      = useNavigate();

  // ── initial fetch ───────────────────────────────────────────
  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(err => { setError('Failed to fetch products'); setLoading(false); });
  }, []);

  // ── search handler ──────────────────────────────────────────
  const handleSearchResults = (results) => setProducts(results);

  // ── render ──────────────────────────────────────────────────
  return (
    <div>
      <SearchBar onResults={handleSearchResults} />

      <h2>Recommended for You</h2>
      <Recommendations />
      <hr />

      <h2>Product Catalog</h2>
      {loading && <p>Loading products…</p>}
      {error   && <p style={{ color:'red' }}>{error}</p>}
      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>
        {products.map(p => (
          <div
            key={p._id}
            onClick={() => navigate(`/products/${p._id}`)}
            style={{ border:'1px solid #ccc', padding:10, width:200, cursor:'pointer' }}
          >
            <img src={p.image} alt={p.name} style={{ width:'100%' }} />
            <h4>{p.name}</h4>
            <p>${p.price.toFixed(2)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
