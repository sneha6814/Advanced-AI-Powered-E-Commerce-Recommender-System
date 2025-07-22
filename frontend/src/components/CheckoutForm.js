// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';

const CheckoutForm = ({ amount, cart, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) return;

    try {
      const { data } = await axios.post('/api/payment/create-payment-intent', {
        amount: Math.round(amount * 100), // amount in cents
      });

      const clientSecret = data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        setProcessing(false);
        setError(null);

        // Place order after successful payment
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/orders',
          { cart, total: amount },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        onSuccess(); // clear cart + show success message in parent
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, marginTop: '20px' }}>
      <CardElement />
      <button
        type="submit"
        disabled={!stripe || processing || succeeded}
        style={{ marginTop: 20 }}
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {succeeded && <div style={{ color: 'green', marginTop: 10 }}>Payment succeeded!</div>}
    </form>
  );
};

export default CheckoutForm;
