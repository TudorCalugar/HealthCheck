import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        if (!formData.agreeToTerms) {
            toast.error('You must agree to the Terms and Conditions');
            setError('You must agree to the Terms and Conditions');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Registration successful! Please login.', {
                    position: "top-right",
                    autoClose: 2000,
                });
                navigate('/login');
            } else {
                toast.error(data.error || 'Registration failed');
                setError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again later.');
            setError('Registration failed. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <img
                    src="/cardiogram.png"
                    alt="MedAI Logo"
                    className="auth-logo"
                />
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="name-group">
                        <div className="form-group">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                required
                                className="auth-input"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                required
                                className="auth-input"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <FiMail className="input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email address"
                            required
                            className="auth-input"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <FiLock className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            className="auth-input"
                            value={formData.password}
                            onChange={handleChange}
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <FiLock className="input-icon" />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            required
                            className="auth-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            minLength="6"
                        />
                    </div>

                    <div className="terms-group">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="agree-terms"
                                name="agreeToTerms"
                                className="checkbox-input"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="agree-terms">
                                I agree to the{' '}
                                <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>{' '}
                                and{' '}
                                <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;