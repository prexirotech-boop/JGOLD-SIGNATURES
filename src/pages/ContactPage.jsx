import React, { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field dynamically
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const tempErrors = {};
        if (!formData.name.trim()) tempErrors.name = 'Full name is required';
        if (!formData.email.trim()) {
            tempErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'Please enter a valid email address';
        }
        if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
        if (!formData.message.trim()) tempErrors.message = 'Message content cannot be empty';
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        
        // Simulate premium database / support ticket submission
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitStatus('success');
        }, 1500);
    };

    const handleReset = () => {
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        });
        setSubmitStatus(null);
        setErrors({});
    };

    return (
        <div className="premium-contact-layout">
            {/* Ambient Background Glows */}
            <div className="ambient-glow glow-1"></div>
            <div className="ambient-glow glow-2"></div>

            <section className="contact-hero">
                <div className="contact-container text-center">
                    <span className="contact-badge">Support Center</span>
                    <h1 className="hero-title">Let's Connect & Build</h1>
                    <p className="hero-subtitle">
                        Have a question about our high-income digital courses, need help accessing your account, or want to discuss scaling your freelance business? We're on standby.
                    </p>
                </div>
            </section>

            <section className="contact-body-sec">
                <div className="contact-container">
                    <div className="contact-grid">
                        
                        {/* LEFT COLUMN: QUICK ASSISTANCE CARDS */}
                        <div className="contact-info-col">
                            
                            {/* Email Support Card */}
                            <div className="glass-card info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper email-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">Email Support</h3>
                                        <p className="card-tagline">Direct inquiry assistance</p>
                                    </div>
                                </div>
                                <p className="card-desc">
                                    For order issues, student inquiries, or technical access assistance, drop us a line anytime. We respond within 24 hours.
                                </p>
                                <div className="card-action-bar">
                                    <a href="mailto:nprecious.official@gmail.com" className="action-btn email-btn">
                                        nprecious.official@gmail.com
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* WhatsApp Support Card */}
                            <div className="glass-card info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper whatsapp-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">WhatsApp Support</h3>
                                        <p className="card-tagline">Instant Chat & Assistance</p>
                                    </div>
                                </div>
                                <p className="card-desc">
                                    Need instant feedback or experiencing payment glitches? Chat directly with our verified business support agents.
                                </p>
                                <div className="card-action-bar">
                                    <a href="https://wa.me/2347041418304?text=Hi%20Amplified%20Skills%20Support,%20I%20have%20an%20inquiry..." target="_blank" rel="noopener noreferrer" className="action-btn whatsapp-btn">
                                        Chat Live on WhatsApp
                                        <span className="live-indicator">
                                            <span className="live-dot"></span>
                                        </span>
                                    </a>
                                </div>
                            </div>

                            {/* Hours of Operation Card */}
                            <div className="glass-card info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper clock-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">Support Hours</h3>
                                        <p className="card-tagline">When we are active</p>
                                    </div>
                                </div>
                                <p className="card-desc">
                                    Our support agents are active:
                                </p>
                                <div className="hours-grid">
                                    <div className="hour-row">
                                        <span className="day">Mon – Fri</span>
                                        <span className="time">9:00 AM – 5:00 PM WAT</span>
                                    </div>
                                    <div className="hour-row weekend">
                                        <span className="day">Sat – Sun</span>
                                        <span className="time">Limited / Email Only</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: INTERACTIVE FORM CARD */}
                        <div className="contact-form-col">
                            <div className="glass-card form-container-card">
                                {submitStatus === 'success' ? (
                                    <div className="success-state text-center">
                                        <div className="success-icon-container">
                                            <div className="success-icon-pulse"></div>
                                            <div className="success-icon-checkmark">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                        <h2 className="success-title">Message Received!</h2>
                                        <p className="success-message">
                                            Thank you, <strong>{formData.name}</strong>. We have successfully received your inquiry regarding <strong>"{formData.subject}"</strong>.
                                        </p>
                                        <p className="success-meta">
                                            A response has been scheduled and will be sent to <strong>{formData.email}</strong> within 24 hours.
                                        </p>
                                        <button onClick={handleReset} className="reset-btn">
                                            Send Another Message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="premium-form">
                                        <div className="form-head">
                                            <h3>Submit a Ticket</h3>
                                            <p>Our helpdesk will process your details automatically</p>
                                        </div>

                                        <div className="form-group-grid">
                                            {/* Full Name */}
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Enter your name" 
                                                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                                                    disabled={isSubmitting}
                                                />
                                                {errors.name && <span className="error-text">{errors.name}</span>}
                                            </div>

                                            {/* Email Address */}
                                            <div className="form-group">
                                                <label className="form-label">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="name@example.com" 
                                                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                                                    disabled={isSubmitting}
                                                />
                                                {errors.email && <span className="error-text">{errors.email}</span>}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="form-group">
                                            <label className="form-label">Subject</label>
                                            <input 
                                                type="text" 
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="What can we help you with?" 
                                                className={`form-input ${errors.subject ? 'input-error' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                            {errors.subject && <span className="error-text">{errors.subject}</span>}
                                        </div>

                                        {/* Message */}
                                        <div className="form-group">
                                            <label className="form-label">Message Content</label>
                                            <textarea 
                                                name="message"
                                                rows="5"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Describe your request in detail (please mention order email or transaction reference if applicable)..." 
                                                className={`form-input form-textarea ${errors.message ? 'input-error' : ''}`}
                                                disabled={isSubmitting}
                                            ></textarea>
                                            {errors.message && <span className="error-text">{errors.message}</span>}
                                        </div>

                                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <span className="submit-loading-wrapper">
                                                    <span className="spinner"></span>
                                                    Transmitting ticket...
                                                </span>
                                            ) : (
                                                <span className="submit-text-wrapper">
                                                    Send Message
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* WORLD CLASS SIMULATED MAP / NETWORK GRID SECTION */}
            <section className="network-map-section">
                <div className="contact-container">
                    <div className="glass-card map-card-container">
                        <div className="map-card-header">
                            <div>
                                <h3 className="map-title">Global Operations Node</h3>
                                <p className="map-subtitle-text">Remote First Support Hub — Lagos, Nigeria Node Active</p>
                            </div>
                            <span className="network-status-badge">
                                <span className="status-pulse-dot"></span>
                                Core Systems Operational
                            </span>
                        </div>
                        
                        <div className="network-map-canvas-container">
                            <svg className="network-map-svg" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
                                {/* Defs for gradients & glowing effects */}
                                <defs>
                                    <radialGradient id="radialGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                    </radialGradient>
                                    <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                        <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>

                                {/* Grid Background pattern */}
                                <g opacity="0.08">
                                    {[...Array(21)].map((_, i) => (
                                        <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="#ffffff" strokeWidth="1" />
                                    ))}
                                    {[...Array(9)].map((_, i) => (
                                        <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#ffffff" strokeWidth="1" />
                                    ))}
                                </g>

                                {/* Abstract continent shapes (highly styled points) */}
                                <g opacity="0.15" fill="#94a3b8">
                                    {/* Americas */}
                                    <circle cx="150" cy="120" r="45" />
                                    <circle cx="200" cy="220" r="35" />
                                    {/* Europe & Africa */}
                                    <circle cx="480" cy="90" r="38" />
                                    <circle cx="510" cy="230" r="50" />
                                    {/* Asia & Australia */}
                                    <circle cx="780" cy="110" r="55" />
                                    <circle cx="850" cy="280" r="30" />
                                </g>

                                {/* Network connection lines */}
                                <g stroke="url(#glowLine)" strokeWidth="1.5" fill="none">
                                    <path d="M 150 120 Q 330 100 510 230" strokeDasharray="5,5" />
                                    <path d="M 480 90 Q 495 160 510 230" />
                                    <path d="M 510 230 Q 640 170 780 110" strokeDasharray="8,4" />
                                    <path d="M 510 230 Q 680 250 850 280" />
                                    <path d="M 200 220 Q 355 225 510 230" />
                                </g>

                                {/* Core network nodes */}
                                <g fill="#475569" stroke="#1e293b" strokeWidth="2">
                                    <circle cx="150" cy="120" r="5" />
                                    <circle cx="200" cy="220" r="4" />
                                    <circle cx="480" cy="90" r="5" />
                                    <circle cx="780" cy="110" r="6" />
                                    <circle cx="850" cy="280" r="5" />
                                </g>

                                {/* Main Active Node: Lagos, Nigeria (Pulsing Glow & Radar rings) */}
                                <g transform="translate(510, 230)">
                                    {/* Radial Glow */}
                                    <circle cx="0" cy="0" r="80" fill="url(#radialGlow)" pointerEvents="none" />
                                    
                                    {/* Outer radar pulse rings */}
                                    <circle cx="0" cy="0" r="28" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.8" className="map-radar-ring ring-1" />
                                    <circle cx="0" cy="0" r="48" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.5" className="map-radar-ring ring-2" />
                                    
                                    {/* Core Node Marker */}
                                    <circle cx="0" cy="0" r="7" fill="#60a5fa" stroke="#ffffff" strokeWidth="2" />
                                    <circle cx="0" cy="0" r="3" fill="#1e3a8a" />
                                </g>

                                {/* Label for Core Node */}
                                <g transform="translate(510, 195)">
                                    <rect x="-85" y="-14" width="170" height="24" rx="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                                    <text x="0" y="2" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                                        AMPLIFIED SKILLS HQ
                                    </text>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{__html: `
                .premium-contact-layout {
                    background-color: #07090e;
                    background-image: 
                        radial-gradient(circle at 10% 20%, rgba(12, 16, 27, 1) 0%, rgba(7, 9, 14, 1) 90%),
                        radial-gradient(circle at 80% 80%, rgba(20, 26, 45, 0.4) 0%, transparent 50%);
                    min-height: 100vh;
                    color: #e2e8f0;
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                    position: relative;
                    overflow: hidden;
                    padding-bottom: 90px;
                }

                /* Background glows */
                .ambient-glow {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(150px);
                    z-index: 0;
                    pointer-events: none;
                }
                .glow-1 {
                    top: -100px;
                    left: -100px;
                    width: 500px;
                    height: 500px;
                    background: rgba(37, 99, 235, 0.15);
                }
                .glow-2 {
                    bottom: 20%;
                    right: -100px;
                    width: 450px;
                    height: 450px;
                    background: rgba(124, 58, 237, 0.12);
                }

                .contact-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                    position: relative;
                    z-index: 1;
                }

                /* Hero Header styling */
                .contact-hero {
                    padding: 100px 0 60px;
                }
                .contact-badge {
                    display: inline-block;
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    padding: 6px 16px;
                    border-radius: 100px;
                    font-size: 11.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 20px;
                    backdrop-filter: blur(5px);
                }
                .hero-title {
                    font-size: 52px;
                    font-weight: 900;
                    letter-spacing: -1.5px;
                    margin: 0 0 20px;
                    background: linear-gradient(135deg, #ffffff 30%, #93c5fd 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-subtitle {
                    font-size: 18px;
                    color: #94a3b8;
                    max-width: 700px;
                    margin: 0 auto;
                    line-height: 1.7;
                    font-weight: 400;
                }

                /* Two Column Layout */
                .contact-body-sec {
                    padding-bottom: 80px;
                }
                .contact-grid {
                    display: grid;
                    grid-template-columns: 1.1fr 1.3fr;
                    gap: 48px;
                    align-items: start;
                }

                /* Glassmorphic cards */
                .glass-card {
                    background: rgba(13, 17, 28, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .glass-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(96, 165, 250, 0.2);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 20px rgba(37, 99, 235, 0.1);
                }

                /* Info column cards */
                .contact-info-col {
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                }
                .info-card {
                    padding: 32px;
                }
                .card-header-flex {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 18px;
                }
                .icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .icon-wrapper svg {
                    width: 24px;
                    height: 24px;
                }

                .email-icon {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
                .whatsapp-icon {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }
                .clock-icon {
                    background: rgba(168, 85, 247, 0.1);
                    color: #a855f7;
                    border: 1px solid rgba(168, 85, 247, 0.2);
                }

                .card-title {
                    font-size: 20px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                }
                .card-tagline {
                    font-size: 12.5px;
                    color: #64748b;
                    margin: 2px 0 0;
                }
                .card-desc {
                    color: #94a3b8;
                    font-size: 14.5px;
                    line-height: 1.6;
                    margin: 0 0 24px;
                }

                /* Actions bar */
                .card-action-bar {
                    display: flex;
                }
                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    font-size: 14.5px;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .email-btn {
                    background: rgba(255, 255, 255, 0.04);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    letter-spacing: 0.5px;
                }
                .email-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #60a5fa;
                    border-color: rgba(96, 165, 250, 0.4);
                }
                .email-btn svg {
                    transition: transform 0.2s;
                }
                .email-btn:hover svg {
                    transform: translateX(4px);
                }

                .whatsapp-btn {
                    background: linear-gradient(135deg, #128c7e, #25d366);
                    color: #ffffff;
                    border: none;
                    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2);
                }
                .whatsapp-btn:hover {
                    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
                    transform: scale(1.02);
                }
                .live-indicator {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .live-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #ffffff;
                    display: inline-block;
                    animation: pulseLive 1.5s infinite;
                }

                @keyframes pulseLive {
                    0% { transform: scale(0.9); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.6; }
                }

                /* Hours presentation */
                .hours-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }
                .hour-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                }
                .hour-row .day {
                    font-weight: 700;
                    color: #ffffff;
                }
                .hour-row .time {
                    color: #94a3b8;
                }
                .hour-row.weekend .day {
                    color: #a855f7;
                }
                .hour-row.weekend .time {
                    color: #64748b;
                }

                /* Form Container and inputs */
                .form-container-card {
                    padding: 44px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .form-head {
                    margin-bottom: 32px;
                }
                .form-head h3 {
                    font-size: 26px;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0 0 6px;
                }
                .form-head p {
                    color: #64748b;
                    font-size: 14.5px;
                    margin: 0;
                }

                .form-group-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .form-group {
                    margin-bottom: 24px;
                    display: flex;
                    flex-direction: column;
                }
                .form-label {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #cbd5e1;
                    margin-bottom: 8px;
                    letter-spacing: 0.3px;
                }
                .form-input {
                    background: rgba(10, 14, 23, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 14px 18px;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 15px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-input::placeholder {
                    color: #475569;
                }
                .form-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                    outline: none;
                }
                .form-textarea {
                    resize: vertical;
                    min-height: 120px;
                }
                .input-error {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                }
                .error-text {
                    color: #f87171;
                    font-size: 12px;
                    font-weight: 600;
                    margin-top: 6px;
                }

                /* Submit Button */
                .submit-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    padding: 16px;
                    font-size: 15.5px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
                    transition: all 0.3s;
                }
                .submit-btn:hover:not(:disabled) {
                    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.45);
                    transform: translateY(-2px);
                }
                .submit-btn:disabled {
                    background: #1e293b;
                    color: #64748b;
                    box-shadow: none;
                    cursor: not-allowed;
                }
                
                .submit-text-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .submit-text-wrapper svg {
                    transition: transform 0.2s;
                }
                .submit-btn:hover:not(:disabled) .submit-text-wrapper svg {
                    transform: translate(2px, -2px);
                }

                .submit-loading-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                /* Spinner */
                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-top: 3px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Success State */
                .success-state {
                    padding: 30px 10px;
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .success-icon-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 28px;
                }
                .success-icon-pulse {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    border-radius: 50%;
                    background: rgba(34, 197, 94, 0.2);
                    animation: circlePulse 2s infinite ease-in-out;
                }
                .success-icon-checkmark {
                    position: absolute;
                    top: 10px; left: 10px; width: 60px; height: 60px;
                    border-radius: 50%;
                    background: #22c55e;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
                }
                .success-icon-checkmark svg {
                    width: 32px;
                    height: 32px;
                }

                @keyframes circlePulse {
                    0% { transform: scale(0.95); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0; }
                    100% { transform: scale(0.95); opacity: 0; }
                }

                .success-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0 0 16px;
                }
                .success-message {
                    font-size: 15px;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin: 0 0 12px;
                }
                .success-meta {
                    font-size: 13.5px;
                    color: #64748b;
                    margin: 0 0 32px;
                }
                
                .reset-btn {
                    background: rgba(255,255,255,0.04);
                    color: #ffffff;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 12px 28px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .reset-btn:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.2);
                    color: #60a5fa;
                }

                /* Simulated Map Section */
                .network-map-section {
                    margin-top: 60px;
                    padding-bottom: 20px;
                }
                .map-card-container {
                    padding: 24px;
                    border: 1px solid rgba(255,255,255,0.04);
                }
                .map-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .map-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0 0 4px;
                }
                .map-subtitle-text {
                    font-size: 13.5px;
                    color: #64748b;
                    margin: 0;
                }
                .network-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(34, 197, 94, 0.08);
                    color: #4ade80;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 6px 14px;
                    border-radius: 50px;
                    border: 1px solid rgba(34, 197, 94, 0.15);
                }
                .status-pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: #4ade80;
                    border-radius: 50%;
                    animation: pulseLive 1.5s infinite;
                }

                .network-map-canvas-container {
                    background: #06090e;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.02);
                    overflow: hidden;
                    position: relative;
                }
                .network-map-svg {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                /* Pulse animations on SVG map */
                .map-radar-ring {
                    transform-origin: center;
                    animation: mapRadar 3s infinite ease-out;
                }
                .ring-2 {
                    animation-delay: 1.5s;
                }

                @keyframes mapRadar {
                    0% { transform: scale(0.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0; }
                }

                /* Responsiveness */
                @media (max-width: 960px) {
                    .contact-grid {
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }
                    .hero-title {
                        font-size: 42px;
                    }
                }

                @media (max-width: 600px) {
                    .contact-hero {
                        padding: 80px 0 40px;
                    }
                    .hero-title {
                        font-size: 34px;
                    }
                    .info-card {
                        padding: 24px;
                    }
                    .form-container-card {
                        padding: 24px;
                    }
                    .form-group-grid {
                        grid-template-columns: 1fr;
                        gap: 0;
                    }
                    .map-card-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                }
            `}} />
        </div>
    );
}
