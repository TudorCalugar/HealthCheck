// TokenPurchase.js
import React, { useState, useContext } from 'react';
import { FiX, FiDollarSign } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { AuthContext } from '../App'; // Adjust path if needed
import './TokenPurchase.css';

// Replace with your own public key from Stripe
const stripePromise = loadStripe('pk_test_51QhB8LAckSTyDSHW1dcrrAAV12HPeTkUZzGicpOG28GLRyRq0qmXUBqogA1RqWnkDhJQlqS3bE0yyo1GhZGV2uct00r3eaj7kJ');

const TokenPurchase = ({ onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const tokenPackages = [
        { amount: 10, price: 9.99 },
        { amount: 25, price: 19.99 },
        { amount: 50, price: 34.99 },
        { amount: 100, price: 59.99 },
    ];

    const handlePurchase = async (pkg) => {
        try {
            setError(null);
            setIsProcessing(true);

            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe failed to initialize');
            }

            // Create checkout session on our backend
            const response = await fetch('http://localhost:5000/create-payment-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    tokenAmount: pkg.amount,
                    price: pkg.price
                })
            });

            const session = await response.json();
            if (!response.ok) {
                throw new Error(session.error || 'Failed to create payment session');
            }

            // Redirect to Stripe checkout
            const result = await stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            setError(error.message || 'Failed to process purchase. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="token-purchase-modal">
            <div className="token-purchase-content">
                <div className="token-purchase-header">
                    <h2>Purchase Tokens</h2>
                    <button className="close-button" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="current-balance">
                    <FiDollarSign />
                    <span>Current Balance: {user?.tokens || 0} tokens</span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="token-packages">
                    {tokenPackages.map((pkg) => (
                        <button
                            key={pkg.amount}
                            className="package-button"
                            onClick={() => handlePurchase(pkg)}
                            disabled={isProcessing}
                        >
                            <span className="token-amount">{pkg.amount} Tokens</span>
                            <span className="token-price">${pkg.price}</span>
                            {isProcessing && <span className="processing">Processing...</span>}
                        </button>
                    ))}
                </div>

                <div className="token-info-text">
                    <p>• Each token allows for one medical analysis upload</p>
                    <p>• Tokens never expire</p>
                    <p>• Purchase more tokens anytime</p>
                </div>
            </div>
        </div>
    );
};

export default TokenPurchase;
