import React from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Legal Framework
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Terms & Conditions
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            These terms govern your access to our online agribusiness platform, quotation requests, and agricultural commodity trade purchases from MIFAS FARMS LTD.
          </p>
        </div>
      </section>

      {/* Content Details */}
      <section style={{ padding: '80px 24px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
        }} className="policy-card">
          <p style={{ fontSize: '16px', lineHeight: '1.75', color: '#475569', marginTop: 0, marginBottom: '32px' }}>
            Welcome to <strong>MIFAS FARMS LTD</strong> ("the Company," "we," "us," or "our"). These Terms & Conditions govern your purchases of physical commodities (Bitter Kola, Kolanuts, Palm Oil, Shea Butter), shipping coordination, and wholesale/retail trade contracts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>1. Product Specifications & Custom Orders</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                All agricultural commodities delivered by MIFAS FARMS meet the laboratory moisture levels and organic safety limits defined on our official Quality Assurance documentation. Buyers are responsible for specifying any custom phytosanitary requirements for their destination country prior to order completion and dispatch.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>2. Pricing, Payments & Tax Compliance</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                All listed prices are displayed in Nigerian Naira (NGN) or United States Dollars (USD) depending on your checkout portal. For wholesale exports, prices are calculated on Free On Board (FOB) or Cost, Insurance, and Freight (CIF) terms as detailed in your custom invoice. Local retail orders must be fully paid via Secure Paystack or direct bank transfer receipt before delivery dispatch.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>3. Shipping, Logistics & Customs</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                We coordinate phytosanitary inspections and custom export clearance with the Nigerian Agricultural Quarantine Service (NAQS). While we manage customs documentation at the origin port in Nigeria, buyers are solely responsible for local import duties, port handling fees, and clearance compliance at the destination port.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>4. Commodity Transit Risk & Liability Limits</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                Risk of loss or crop damage transfers to the buyer upon handoff to the ocean liner or freight forwarder at the shipping port (FOB terms). MIFAS FARMS LTD is not liable for maritime delays, weather disruptions, customs detentions at the destination port, or shelf-life reduction due to inadequate buyer warehouse temperature control.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Have any legal inquiries?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            If you need custom SLA contracts or legal documentation for bulk export shipments, please contact our logistics compliance team.
          </p>
          <Link to="/contact" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '11px 24px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '13.5px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Contact Compliance
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          .policy-card {
            padding: 24px !important;
          }
        }
      `}</style>

    </div>
  )
}
