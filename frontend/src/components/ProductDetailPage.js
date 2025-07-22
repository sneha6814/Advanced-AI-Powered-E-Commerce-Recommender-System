import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import FrequentlyBought from './FrequentlyBought';

function ProductDetailPage() {
  const { id }        = useParams();        // productId from URL
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(res => { setProduct(res.data); setLoading(false); })
      .catch(()  => { setError('Product not found'); setLoading(false); });
  }, [id]);

  if (loading) return <p>Loading product…</p>;
  if (error)   return <p style={{color:'red'}}>{error}</p>;
  if (!product) return null;

  return (
    <div style={{ padding:'20px' }}>
      <h2>{product.name}</h2>
      <img src={product.image} alt={product.name} style={{ width:250 }} />
      <p><b>Price:</b> ${product.price.toFixed(2)}</p>
      <p><b>Brand:</b> {product.brand}</p>
      <p><b>Category:</b> {product.category}</p>
      <p><b>Description:</b> {product.description}</p>
      <p><b>Stock:</b> {product.stock}</p>

      <button onClick={() => addToCart(product)}>Add to Cart</button>

      {/* ― Frequently Bought Together ― */}
      <FrequentlyBought productId={product._id} />
    </div>
  );
}

export default ProductDetailPage;
