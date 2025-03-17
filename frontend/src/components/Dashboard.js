// Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { FiClock, FiFile, FiChevronRight } from 'react-icons/fi';
import { AuthContext } from '../App'; // Adjust import if needed
import './Dashboard.css';

const Dashboard = () => {
    const [analyses, setAnalyses] = useState([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useContext(AuthContext);

    useEffect(() => {
        fetchAnalysisHistory();
        fetchUserData();

        // Check for successful Stripe payment
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            // Remove the session_id param from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // 1) Verify the checkout session on the server
            verifyPaymentSession(sessionId);
        }
    }, []);

    const verifyPaymentSession = async (sessionId) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(
                `http://localhost:5000/verify-checkout-session?session_id=${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await resp.json();
            if (resp.ok) {
                console.log('[VERIFY CHECKOUT SESSION]', data.message);
                // Re-fetch user data to see updated token count
                fetchUserData();
            } else {
                console.error('[VERIFY CHECKOUT SESSION] Error:', data.error);
            }
        } catch (err) {
            console.error('Error verifying checkout session:', err);
        }
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/user-data', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser((prevUser) => ({
                    ...prevUser,
                    tokens: userData.tokens
                }));
                // Update localStorage so tokens are up-to-date
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    localStorage.setItem(
                        'user',
                        JSON.stringify({
                            ...storedUser,
                            tokens: userData.tokens
                        })
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchAnalysisHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/analysis-history', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setAnalyses(data);
            } else {
                setError(data.error || 'Failed to fetch analysis history');
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setError('Failed to load analysis history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="dashboard-loading">Loading your analysis history...</div>;
    }

    if (error) {
        return <div className="dashboard-error">{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="background-pattern">
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <pattern
                            id="medical-icons-dashboard"
                            x="0"
                            y="0"
                            width="50"
                            height="50"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M10 10 Q 20 20, 30 10 Q 40 0, 50 10"
                                fill="none"
                                stroke="rgba(0,201,255,0.15)"
                                strokeWidth="2"
                            />
                            <path
                                d="M60 40 L70 30 M65 35 L75 25"
                                stroke="rgba(146,254,157,0.15)"
                                strokeWidth="2"
                            />
                            <path
                                d="M10 40 L20 35 L30 45 L40 30"
                                fill="none"
                                stroke="rgba(0,201,255,0.15)"
                                strokeWidth="2"
                            />
                            <path
                                d="M70 10 L70 20 M65 15 L75 15"
                                stroke="rgba(146,254,157,0.15)"
                                strokeWidth="2"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#medical-icons-dashboard)" />
                </svg>
            </div>

            <div className="dashboard-header">
                <h1>My Analysis History</h1>
                <p>View and manage your medical analysis records</p>
            </div>

            <div className="dashboard-content">
                <div className="analysis-list">
                    {analyses.length === 0 ? (
                        <div className="dashboard-empty">
                            <h2>No Analysis History</h2>
                            <p>You haven't uploaded any medical analyses yet.</p>
                        </div>
                    ) : (
                        analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className={`analysis-item ${selectedAnalysis?.id === analysis.id ? 'selected' : ''}`}
                                onClick={() => setSelectedAnalysis(analysis)}
                            >
                                <div className="analysis-item-header">
                                    <FiFile className="analysis-icon" />
                                    <div className="analysis-info">
                                        <h3>{analysis.original_filename}</h3>
                                        <p>
                                            <FiClock className="time-icon" />
                                            {formatDate(analysis.analysis_date)}
                                        </p>
                                    </div>
                                    <FiChevronRight className="chevron-icon" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedAnalysis && (
                    <div className="analysis-detail">
                        <div className="detail-header">
                            <h2>Analysis Details</h2>
                            <span className="date">{formatDate(selectedAnalysis.analysis_date)}</span>
                        </div>
                        <div className="detail-content">
                            <div className="image-container">
                                <img
                                    src={`http://localhost:5000/uploads/${selectedAnalysis.stored_filename}`}
                                    alt="Analysis"
                                />
                            </div>
                            <div className="analysis-text">
                                <h3>AI Analysis & Recommendations</h3>
                                <div className="text-content">
                                    {selectedAnalysis.analysis_text.split('\n').map((text, index) => (
                                        <p key={index}>{text}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
