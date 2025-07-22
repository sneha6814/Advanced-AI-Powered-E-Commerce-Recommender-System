import React from 'react';
import banner from '../assets/banner.jpg'; // Adjust path if different

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to the AI E-Commerce Site</h1>
      <img src={banner} alt="AI E-Commerce Banner" className="home-banner" />

    </div>
  );
}

export default Home;
