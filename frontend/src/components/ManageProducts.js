import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductUploadForm from './ProductUploadForm';


function ManageProducts() {
  const [products, setProducts] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState({});

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (error) {
      alert('Failed to fetch products');
    }
  };

  const startEditing = (product) => {
    setEditingId(product._id);
    setEditingProduct(product);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/products/${editingId}`, editingProduct, config);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      alert('Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, config);
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Dashboard - Manage Products</h2>

      <section style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Upload New Product</h3>
        <ProductUploadForm />
      </section>

      
      <h3>Existing Products</h3>
      {products.map(p => (
        <div key={p._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          {editingId === p._id ? (
            <>
              <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              <input value={editingProduct.brand} onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})} />
              <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: +e.target.value})} />
              <input value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
              <input value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
              <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: +e.target.value})} />
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <img src={p.image} alt={p.name} style={{ width: '100px' }} />
              <p>{p.brand} - {p.name}</p>
              <p>${p.price.toFixed(2)}</p>
              <p>Category: {p.category}</p>
              <p>Stock: {p.stock}</p>
              <button onClick={() => startEditing(p)}>Edit</button>
              <button onClick={() => handleDelete(p._id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ManageProducts;
