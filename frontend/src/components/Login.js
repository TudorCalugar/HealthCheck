import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { AuthContext } from '../App';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { setIsAuthenticated, setUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
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

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsAuthenticated(true);
                setUser(data.user);
                toast.success('Successfully logged in!', {
                    position: "top-right",
                    autoClose: 2000,
                });
                navigate('/dashboard');
            } else {
                toast.error(data.error || 'Invalid credentials');
                setError(data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again later.');
            setError('Login failed. Please try again later.');
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
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">
                    New to HealthCheck?{' '}
                    <Link to="/register">Create an account</Link>
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
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
                        />
                    </div>

                    <div className="remember-forgot">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="remember-me"
                                name="rememberMe"
                                className="checkbox-input"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <label htmlFor="remember-me">Remember me</label>
                        </div>
                        <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;