// src/stripe.js
import { loadStripe } from '@stripe/stripe-js';

// Use your **publishable key** (pk_test_...)
const stripePromise = loadStripe('pk_test_51RlzOj2YRcrC5rAYfQDy3Ks047ZVYXu07m6xqF8VVWlwlZruZNG5TTUxD16oZZJadoP6SzS3jqY9N6Bdy042JQyC00PWrfYx0A');

export default stripePromise;
