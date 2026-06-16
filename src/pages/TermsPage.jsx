import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="policy-page-layout">
      <div className="policy-container">
        
        {/* Back Link */}
        <button onClick={() => navigate('/')} className="back-home-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </button>

        {/* Title Header */}
        <header className="policy-header">
          <span className="policy-badge">Legal Terms</span>
          <h1 className="policy-title">Terms & Conditions</h1>
          <p className="policy-meta">Last updated: {new Date().getFullYear()}</p>
        </header>

        {/* Content Details */}
        <div className="policy-card">
          <p className="policy-intro">
            Welcome to <strong>Amplified Skills</strong> ("the Platform," "we," "us," or "our"). These Terms & Conditions govern your access to our website, purchase of digital courses or blueprints, and use of our student learning dashboard.
          </p>

          <section className="policy-section">
            <h2 className="section-title">1. Acceptance of Terms</h2>
            <p>
              By accessing this website, registering a student account, or purchasing any of our materials, you acknowledge that you have read, understood, and accept these Terms & Conditions in full. If you do not agree with any part of these terms, please discontinue use of the website immediately.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">2. Digital Products License & Use</h2>
            <p>
              All materials available on Amplified Skills (including video lessons, worksheets, templates, code samples, and course guides) are digital assets. 
            </p>
            <p>
              Upon purchase, we grant you a single, non-transferable, non-sublicensable, personal license to use the materials for educational purposes only. You may not distribute, reproduce, share credentials, resell, or publicly display any content from our platform without our explicit prior written consent.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">3. Earnings & Performance Disclaimer</h2>
            <p>
              Amplified Skills is an educational academy. We teach strategies, practical web design techniques, and freelance systems. 
            </p>
            <p>
              We explicitly do not guarantee that you will make any specific amount of money or secure global clients. Your business success depends entirely on your own effort, execution, skill implementation, and external market variables.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">4. Limitation of Liability</h2>
            <p>
              In no event shall Amplified Skills, Nnanta Precious, or any of our representatives be liable for any direct, indirect, consequential, or incidental damages or financial losses arising out of your implementation of the strategies taught on our website or within our digital blueprints.
            </p>
          </section>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .policy-page-layout {
          background-color: #f8fafc;
          min-height: 100vh;
          color: #334155;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          padding: 80px 20px;
          box-sizing: border-box;
        }
        .policy-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-home-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 14px;
          fontWeight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          margin-bottom: 32px;
          transition: color 0.15s ease;
        }
        .back-home-btn:hover {
          color: #2563eb;
        }
        .policy-header {
          margin-bottom: 40px;
        }
        .policy-badge {
          display: inline-block;
          background: rgba(37, 99, 235, 0.06);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.15);
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .policy-title {
          font-size: 38px;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 8px;
          letter-spacing: -0.8px;
        }
        .policy-meta {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
        }
        .policy-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.04);
        }
        .policy-intro {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin-top: 0;
          margin-bottom: 32px;
        }
        .policy-section {
          margin-bottom: 32px;
          border-top: 1px solid #f1f5f9;
          padding-top: 28px;
        }
        .policy-section:last-of-type {
          margin-bottom: 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
        }
        .policy-section p {
          font-size: 15px;
          line-height: 1.7;
          color: #475569;
          margin: 0 0 16px;
        }
        .policy-section p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          .policy-card {
            padding: 24px;
          }
          .policy-title {
            font-size: 30px;
          }
        }
      `}} />
    </div>
  );
}
