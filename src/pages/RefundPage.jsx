import React from 'react';

export default function RefundPage() {

  return (
    <div className="policy-page-layout">
      <div className="policy-container">

        {/* Title Header */}
        <header className="policy-header">
          <span className="policy-badge">Company Policy</span>
          <h1 className="policy-title">Refund Policy</h1>
          <p className="policy-meta">Last updated: {new Date().getFullYear()}</p>
        </header>

        {/* Content Details */}
        <div className="policy-card">
          <p className="policy-intro">
            At <strong>Amplified Skills</strong>, we are committed to providing you with the highest quality training programs, resources, and digital blueprints to build a highly profitable freelance and digital service business.
          </p>

          <section className="policy-section">
            <h2 className="section-title">1. No Refund Policy</h2>
            <p>
              Due to the nature of digital products (including courses, downloadable blueprints, guides, templates, and video lessons), all sales are final. Once your purchase is complete and your product access or student dashboard account is activated, the product is considered "used."
            </p>
            <p className="policy-alert">
              <strong>We do not offer refunds, returns, or exchanges for any reason.</strong> This is because digital materials cannot be "returned" or deactivated in the same way physical goods can.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">2. Delivery Guarantee</h2>
            <p>
              While we do not offer refunds, we do guarantee successful delivery. If you experience any technical issues accessing your student dashboard, logging in, or retrieving your purchased blueprints, please contact us immediately. We will make sure your access is restored.
            </p>
          </section>

          <section className="policy-section">
            <h2 className="section-title">3. Support & Inquiries</h2>
            <p>
              If you have any questions about the content of our blueprints, need help navigating the student area, or have any issues with your payment, please reach out to our dedicated support helpdesk at:
            </p>
            <div className="policy-support-box">
              <strong>Email Support:</strong> <a href="mailto:nprecious.official@gmail.com">nprecious.official@gmail.com</a>
            </div>
            <p>
              Our response team is active Monday through Friday, and we aim to respond to all technical queries within 24 hours.
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
        .policy-alert {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 16px;
          border-radius: 0 12px 12px 0;
          color: #991b1b !important;
          margin-top: 20px;
        }
        .policy-support-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          font-size: 15px;
          margin: 16px 0;
        }
        .policy-support-box a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 700;
        }
        .policy-support-box a:hover {
          text-decoration: underline;
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
