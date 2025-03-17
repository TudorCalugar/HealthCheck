import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import {
    FiHome,
    FiUpload,
    FiInfo,
    FiClipboard,
    FiUser,
    FiUserPlus,
    FiLogOut,
    FiFileText,
    FiStar
} from 'react-icons/fi';
import { AuthContext } from '../App';  // Update the path if needed
import TokenPurchase from './TokenPurchase'; // Make sure this path is correct
import './NavBar.css';

function NavBar() {
    const { isAuthenticated, setIsAuthenticated, user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // NEW: Local state to show/hide the purchase modal
    const [showTokenPurchase, setShowTokenPurchase] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src="/cardiogram.png" alt="MedAI Logo" className="logo-image" />
                </Link>
            </div>

            <ul className="navbar-links">
                <li>
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                        <FiHome className="navbar-icon" />
                        Home
                    </NavLink>
                </li>

                {isAuthenticated && (
                    <>
                        <li>
                            <NavLink
                                to="/upload"
                                className={({ isActive }) => (isActive ? 'active' : '')}
                            >
                                <FiUpload className="navbar-icon" />
                                Upload
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) => (isActive ? 'active' : '')}
                            >
                                <FiFileText className="navbar-icon" />
                                My Analysis
                            </NavLink>
                        </li>
                    </>
                )}

                <li>
                    <HashLink smooth to="/#about">
                        <FiInfo className="navbar-icon" />
                        About
                    </HashLink>
                </li>
                <li>
                    <HashLink smooth to="/#services">
                        <FiClipboard className="navbar-icon" />
                        Services
                    </HashLink>
                </li>

                {isAuthenticated ? (
                    <li className="user-section">
                        <div className="user-info">
                            <FiUser className="navbar-icon" />
                            {/* Display user's name and tokens */}
                            <span>
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="token-count">
                                (
                                <FiStar className="navbar-icon" />
                                {user?.tokens || 0}
                                )
                            </span>
                        </div>

                        {/* "Buy Tokens" button in the NavBar */}
                        <button
                            className="buy-tokens-btn"
                            onClick={() => setShowTokenPurchase(true)}
                        >
                            Buy Tokens
                        </button>

                        {/* Logout button */}
                        <button onClick={handleLogout} className="logout-button">
                            <FiLogOut className="navbar-icon" />
                            Logout
                        </button>

                        {/* Conditionally render the TokenPurchase modal */}
                        {showTokenPurchase && (
                            <TokenPurchase onClose={() => setShowTokenPurchase(false)} />
                        )}
                    </li>
                ) : (
                    <>
                        <li>
                            <NavLink
                                to="/login"
                                className={({ isActive }) => (isActive ? 'active' : '')}
                            >
                                <FiUser className="navbar-icon" />
                                Login
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/register"
                                className={({ isActive }) => (isActive ? 'active' : '')}
                            >
                                <FiUserPlus className="navbar-icon" />
                                Register
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;
