import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail } from 'react-icons/fi'; // Importing phone and mail icons
import { MdInfo, MdHealthAndSafety } from 'react-icons/md'; // Importing icons for About and Services
import './styles.css';

function Home() {
    const [isContactVisible, setIsContactVisible] = useState(false);
    const contactRef = useRef(null);

    const toggleContactInfo = () => {
        setIsContactVisible(!isContactVisible);
    };

    // Close contact info when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contactRef.current && !contactRef.current.contains(event.target)) {
                setIsContactVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contactRef]);

    return (
        <>
            {/* Contact Icon Container */}
            <div className="contact-container" ref={contactRef}>
                <button
                    className="contact-button"
                    onClick={toggleContactInfo}
                    aria-label="Contact Us"
                >
                    <FiPhone />
                </button>
                <span className="contact-description">Support</span>
                {isContactVisible && (
                    <div className="contact-info">
                        <p><FiMail /> <a href="mailto:support@HealthCheck.com">support@HealthCheck.com</a></p>
                        <p><FiPhone /> <a href="tel:+1234567890">+1 (234) 567-890</a></p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="container">
                <div className="left-panel">
                    <div className="logo">
                        <img src="/cardiogram.png" alt="MedAI Logo" />
                    </div>
                    <div className="text-content">
                        <h1>
                        HealthCheck
                            <br />
                        </h1>
                        <p>Clear analyses, health at hand</p>
                        <div className="button-group">
                            <Link to="/upload">
                                <button className="upload-button">Upload analysis</button>
                            </Link>
                            <a href="#about">
                                <button className="learn-more-button">Learn More</button>
                            </a>
                            <a href="#services">
                                <button className="services-button">Our Services</button>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="right-panel">
                    <img
                        src="/doctor.jpg"
                        alt="Doctor with tablet"
                        className="doctor-image"
                    />
                </div>
            </div>
            <div id="about" className="about-section">
                <div className="about-content">
                    <div className="about-text">
                        <h2>
                            <MdInfo className="about-icon" />
                            About HealthCheck
                        </h2>
                        <p>
                            Welcome to HealthCheck! Our mission is to provide clear and accessible health analyses at your fingertips.
                            With cutting-edge technology and a user-friendly interface, we aim to empower you to take control of your health.
                            Whether you're uploading your latest lab results or seeking insights into your health data, HealthCheck is here to assist you every step of the way.
                        </p>
                    </div>
                </div>
            </div>
            <div id="services" className="services-section">
                <div className="services-content">
                    <div className="services-text">
                        <h2>
                            <MdHealthAndSafety className="services-icon" />
                            Our Services
                        </h2>
                        <p>
                            At HealthCheck, we offer a range of services designed to help you understand and manage your health data effectively.
                            Our services include:
                        </p>
                        <ul>
                            <li>Comprehensive Health Data Analysis</li>
                            <li>Personalized Health Insights</li>
                            <li>Secure Data Storage and Management</li>
                            <li>24/7 Access to Your Health Reports</li>
                            <li>Expert Consultation and Support</li>
                        </ul>
                        <p>
                            Our team of medical professionals and data scientists work tirelessly to ensure that you receive accurate and actionable health information.
                            Trust HealthCheck to be your partner in achieving optimal health and wellness.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Home;
