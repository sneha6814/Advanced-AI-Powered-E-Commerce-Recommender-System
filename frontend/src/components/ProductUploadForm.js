import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function ProductUploadForm() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    subcategory: '',
    brand: '',
    stock: ''
  });

  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  let user;
  try {
    user = jwtDecode(token);
  } catch {
    user = null;
  }

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      setMessage('Access denied: Admins only');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/products', product, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessage('Product uploaded successfully');
    } catch (err) {
      setMessage('Error uploading product');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required /><br />
        <input name="description" placeholder="Description" onChange={handleChange} /><br />
        <input name="price" type="number" placeholder="Price" onChange={handleChange} required /><br />
        <input name="image" placeholder="Image URL" onChange={handleChange} /><br />
        <input name="category" placeholder="Category" onChange={handleChange} /><br />
        <input name="subcategory" placeholder="Subcategory" onChange={handleChange} /><br />
        <input name="brand" placeholder="Brand" onChange={handleChange} /><br />
        <input name="stock" type="number" placeholder="Stock" onChange={handleChange} /><br />
        <button type="submit">Upload Product</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default ProductUploadForm;
