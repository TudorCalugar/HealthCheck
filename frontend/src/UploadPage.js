import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import { MdAssessment } from 'react-icons/md';
import './UploadPage.css';

function UploadPage() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const [isAgreed, setIsAgreed] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [messageType, setMessageType] = useState('');

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setResponseMessage('');
        setImageUrl('');
        setImageDescription('');
        setMessageType('');
    };

    const handleAgreementChange = (e) => {
        setIsAgreed(e.target.checked);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setResponseMessage('Please select an image to upload.');
            setMessageType('error');
            return;
        }

        if (!isAgreed) {
            setResponseMessage('You must agree to the data processing terms.');
            setMessageType('agreementError');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setResponseMessage('Please login to upload files.');
            setMessageType('error');
            navigate('/login');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            setIsUploading(true);
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setResponseMessage(data.message);
                setImageUrl(data.filePath);
                setImageDescription(data.description);
                setMessageType('success');
                // Optional: Navigate to dashboard after successful upload
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setResponseMessage(data.error || 'Error uploading file');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setResponseMessage('Error uploading file. Please try again.');
            setMessageType('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <h1>
                <MdAssessment className="analysis-icon" />
                Upload Your Analysis
            </h1>

            {/* Considerations Section */}
            <div className="considerations">
                <div className="considerations-header">
                    <FiInfo className="info-icon" />
                    <h2>Considerations Before Uploading</h2>
                </div>
                <div className="considerations-content">
                    <p>Ensure that the image is clear and legible.</p>
                    <p>Only upload images of your medical analyses.</p>
                    <p>Avoid uploading sensitive personal information.</p>
                    <p>Supported formats: JPEG, PNG, PDF.</p>
                </div>
            </div>

            {/* Data Processing Agreement Section */}
            <div className="data-agreement">
                <h2>Data Processing Agreement</h2>
                <p>
                    By uploading your analysis, you agree that HealthCheck will process your data
                    solely for the purpose of providing health insights and analysis. We ensure that
                    your data is handled with the highest standards of security and confidentiality.
                </p>
                <label>
                    <input
                        type="checkbox"
                        checked={isAgreed}
                        onChange={handleAgreementChange}
                    />
                    I agree to the data processing terms.
                </label>
            </div>

            {/* Upload Form */}
            <div className="upload-form">
                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />
                    <button type="submit" disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
                {responseMessage && (
                    <p className={`response-message ${messageType}`}>{responseMessage}</p>
                )}
                {imageUrl && (
                    <div className="uploaded-image">
                        <h2>Uploaded Image:</h2>
                        <img src={imageUrl} alt="Uploaded Analysis" />
                    </div>
                )}
                {imageDescription && (
                    <div className="image-description">
                        <h2>Analysis Results:</h2>
                        <p>{imageDescription}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UploadPage;