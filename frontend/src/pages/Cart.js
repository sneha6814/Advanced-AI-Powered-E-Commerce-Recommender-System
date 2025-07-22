// src/pages/Cart.js
import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe('pk_test_51RlzOj2YRcrC5rAYfQDy3Ks047ZVYXu07m6xqF8VVWlwlZruZNG5TTUxD16oZZJadoP6SzS3jqY9N6Bdy042JQyC00PWrfYx0A'); // <-- Your Stripe publishable key

function Cart() {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Called after successful payment and order placement
  const handlePaymentSuccess = () => {
    clearCart();
    setOrderPlaced(true);
  };

  if (!user) {
    return <p>Please log in to view and checkout your cart.</p>;
  }

  return (
    <div>
      <h2>Your Cart</h2>

      {orderPlaced && (
        <div style={{ padding: '1rem', border: '2px solid green', marginBottom: '1rem' }}>
          ✅ Order placed successfully! Thank you for shopping with us.
        </div>
      )}

      {cart.length === 0 && !orderPlaced ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={item._id}
              style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}
            >
              <h4>{item.name}</h4>
              <img src={item.image} alt={item.name} style={{ width: '150px' }} />
              <p>Price: ${item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeFromCart(item._id)}>Remove</button>
            </div>
          ))}
          <h3>Total: ${total.toFixed(2)}</h3>

          <Elements stripe={stripePromise}>
            <CheckoutForm amount={total} cart={cart} onSuccess={handlePaymentSuccess} />
          </Elements>
        </>
      )}
    </div>
  );
}

export default Cart;
