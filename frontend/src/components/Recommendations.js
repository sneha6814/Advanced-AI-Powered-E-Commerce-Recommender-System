import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useContext(CartContext);
  const navigate      = useNavigate();

  // ⬇️  make sure your AuthContext returns these fields
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    // If user not logged-in or no token → skip fetch and stop loading spinner
    if (!user || !token) {
      console.log('[Recs] No user or token - skipping fetch');
      setLoading(false);
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      console.log('[Recs] Fetching for user', user.id);

      try {
        const res = await axios.get('http://localhost:5000/api/recommendations/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[Recs] Response:', res.status, res.data);
        setRecommendations(res.data || []);
        setError(null);
      } catch (err) {
        console.error('[Recs] Axios error:', err);
        const status = err.response?.status || 'N/A';
        setError(`Failed to load recommendations (status ${status})`);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, token]);

  // ── UI states ───────────────────────────────────────────────
  if (loading)            return <p>Loading recommendations...</p>;
  if (error)              return <p style={{ color: 'red' }}>{error}</p>;
  if (recommendations.length === 0)
                          return <p>No recommendations available.</p>;

  // ── Render cards ────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {recommendations.map((p) => (
          <div 
          key={p._id}
          onClick={() => navigate(`/products/${p._id}`)}
          style={{ border:'1px solid #ccc', padding:10, width:200, cursor:'pointer' }}
          >
            <img src={p.image} alt={p.name} style={{ width: '100%' }} />
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

export default Recommendations;
