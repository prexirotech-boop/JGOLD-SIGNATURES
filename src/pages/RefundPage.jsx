import React from 'react'
import { Link } from 'react-router-dom'

export default function RefundPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Trade Policies
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Refund & Returns Policy
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            Our standard protocol for crop qualities, order cancellations, and shipping refund claims.
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
            At <strong>MIFAS FARMS LTD</strong>, we take pride in sourcing and packaging export-grade agricultural commodities. Since agriculture deals with raw, natural, and perishable products, we operate on clear, standard commercial refund policies.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>1. Non-Refundable Dispatched Goods</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', marginBottom: '12px' }}>
                Once wholesale or retail orders are packaged, cleared by the Nigerian Agricultural Quarantine Service (NAQS), and loaded into shipping containers, the sale is final. Perishable and raw items (such as Bitter Kola and Kolanuts) cannot be returned, swapped, or refunded after ship dispatch.
              </p>
              <div style={{
                background: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                padding: '16px',
                borderRadius: '0 8px 8px 0',
                color: '#991b1b',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Please ensure you review laboratory moisture tests and SGS certificates prior to container booking.
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>2. Pre-Dispatch Order Cancellations</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                For standard retail store checkouts, you may request an order cancellation and receive a full payment gateway refund if you write to us within 2 hours of payment and before local delivery has been dispatched. Bulk contract deposits are governed exclusively by individual signed purchase SLA terms.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>3. Quality Discrepancies Claims</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                We inspect every batch for standard moisture specs. In the highly unlikely event that your cargo arrives showing moisture deviation or insect damage outside of contract specifications, a formal claim accompanied by an accredited lab test must be submitted within 7 days of cargo arrival at the destination port. Verified claims will be compensated through balance deductions on subsequent shipments or partial product replacement.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Need to file a quality claim?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            Please submit your destination inspection lab results and photos to our trade claims department.
          </p>
          <a href="mailto:support@mifasfarms.com" style={{
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
            Email Claims Desk
          </a>
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
