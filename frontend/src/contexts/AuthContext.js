// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [userTokens, setUserTokens] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
            fetchUserTokens(token).then((bal) => setUserTokens(bal));
        }
    }, []);

    // Helper: fetch token count from server
    const fetchUserTokens = async (jwt) => {
        try {
            const res = await fetch('http://localhost:5000/user/tokens', {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch tokens');
            }
            const data = await res.json();
            return data.tokens || 0;
        } catch (error) {
            console.error('Error fetching tokens:', error);
            return 0;
        }
    };

    // Refresh after a successful purchase or upload
    const refreshUserTokens = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            const newBalance = await fetchUserTokens(token);
            setUserTokens(newBalance);
        }
    };

    // Log out
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setUserTokens(0);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                setIsAuthenticated,
                user,
                setUser,
                userTokens,
                setUserTokens,
                refreshUserTokens,
                handleLogout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
