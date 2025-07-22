import React, { useState } from 'react';
import axios from 'axios';

function SearchBar({ onResults }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      onResults([]);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(trimmedQuery)}`);
      onResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Search products like 'leather bag', 'timepiece under 100'"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '300px', padding: '8px', fontSize: '16px' }}
      />
      <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '16px' }}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      {error && <p style={{ color: 'red', marginLeft: '10px' }}>{error}</p>}
    </form>
  );
}

export default SearchBar;
