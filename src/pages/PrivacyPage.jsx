import React from 'react';

export default function PrivacyPage() {

  return (
    <div className="policy-page-layout">
      <div className="policy-container">

        {/* Title Header */}
        <header className="policy-header">
          <span className="policy-badge">Data Privacy</span>
          <h1 className="policy-title">Privacy Policy</h1>
          <p className="policy-meta">Last updated: {new Date().getFullYear()}</p>
        </header>

        {/* Content Details */}
        <div className="policy-card">
          <p className="policy-intro">
            This Privacy Policy document describes how <strong>Amplified Skills</strong> ("the Platform," "we," "us," or "our") collects, uses, records, and protects your personal information when you access our website, enroll in our training programs, or buy our digital blueprints.
          </p>

          <section className="policy-section">
            <h2 className="section-title">1. Information We Collect</h2>
            <p>
              When you enroll in our courses, download blueprints, or sign up for account access, we collect personal information that you provide to us voluntarily. This includes:
            </p>
            <ul className="policy-list">
              <li><strong>Personal Identifiers:</strong> Your full name, email address, and phone number.</li>
              <li><strong>Purchase Records:</strong> Details of the blueprints or courses you have purchased and transaction reference IDs.</li>
            </ul>
            <p>
              We collect this information purely for the purposes of order fulfillment, student account generation, dashboard access authentication, and providing customer support.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">2. How We Use Your Information</h2>
            <p>
              We use the collected information for the following specific purposes:
            </p>
            <ul className="policy-list">
              <li>Delivering automated registration and product access details to your email.</li>
              <li>Setting up and authenticating your student portal account.</li>
              <li>Allowing our support agents to verify your purchase history if you lose access links.</li>
              <li>Sending periodic updates, billing notifications, and promotional offers (which you can opt-out of at any time).</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2 className="section-title">3. Payment & Data Security</h2>
            <p>
              All customer payments are processed securely through our verified payment gateway partner, <strong>Paystack</strong>. 
            </p>
            <p>
              We do not collect, process, or store your credit/debit card numbers, bank pin details, or USSD codes on our own servers. Paystack handles all payment card industry (PCI) compliance protocols.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">4. Third-Party Sharing & Cookies</h2>
            <p>
              We respect your privacy. We do not sell, rent, trade, or share your personal information with third-party marketers. 
            </p>
            <p>
              We use basic cookies and tracking technologies (like Facebook Pixel) to analyze traffic, manage session persistence, remember cart selections on browser refresh, and optimize your navigation experience.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">5. Social Media Disclaimer</h2>
            <p>
              This website is not affiliated with, endorsed by, or associated with Meta Platforms, Inc. or Facebook Inc. in any way. "Facebook" and "Meta" are registered trademarks of their respective owners.
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
        .policy-list {
          list-style: disc;
          padding-left: 20px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
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
