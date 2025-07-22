import { useEffect, useState } from 'react';
import axios from 'axios';

function FrequentlyBought({ productId }) {
  const [items,  setItems]  = useState([]);
  const [load,   setLoad]   = useState(true);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    if (!productId) return;

    setLoad(true);
    axios.get(`http://localhost:5000/api/frequent/${productId}`)
      .then(res => { setItems(res.data); setLoad(false); })
      .catch(()  => { setError('Could not load'); setLoad(false); });
  }, [productId]);

  if (load)  return <p>Loading related products…</p>;
  if (error || items.length === 0) return null;

  return (
    <div style={{ marginTop:30 }}>
      <h3>Frequently Bought Together</h3>
      <div style={{ display:'flex', gap:15, flexWrap:'wrap' }}>
        {items.map(p => (
          <div key={p._id} style={{ border:'1px solid #ccc', padding:10, width:160 }}>
            <img src={p.image} alt={p.name} style={{ width:'100%' }} />
            <p style={{ fontSize:'0.9rem' }}>{p.name}</p>
            <p style={{ fontWeight:'bold' }}>${p.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FrequentlyBought;
