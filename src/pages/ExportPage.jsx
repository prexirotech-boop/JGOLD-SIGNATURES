import React from 'react'
import { Link } from 'react-router-dom'

export default function ExportPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Trusted Globally
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Logistics & Global Export Markets
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            MIFAS FARMS connects premium local agricultural yields directly with manufacturers, retailers, and distributors in North America, Europe, Asia, and the Middle East.
          </p>
        </div>
      </section>

      {/* Export Logistics details */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:('48px'), alignItems: 'center' }} className="export-flex">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, marginBottom: '20px' }}>Shipping & Trade Terms</h2>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', marginBottom: '16px' }}>
              We offer standard shipping terms depending on buyer preference and volume requirements. We regularly execute transactions on **FOB (Free on Board)** and **CIF (Cost, Insurance & Freight)** terms.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>✓</div>
                <div><strong>Port of Departure</strong>: Apapa Port (LGS), Tin Can Island Port, or Onne Port (PHC).</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>✓</div>
                <div><strong>Container Options</strong>: LCL (Less than Container Load) for dry nuts, or FCL (20ft/40ft Full Container Load).</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>✓</div>
                <div><strong>Lead Times</strong>: 14 to 30 days depending on target destination port.</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0d2e1a', marginBottom: '16px' }}>Commodity Packaging Guidelines</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px', color: '#475569' }}>
                <div>
                  <strong>Bitter Kola / Garcinia Kola</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>Packaged in 25kg / 50kg polypropylene bags with moisture-absorbing silica gel liners, or customized export cartons.</p>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <strong>Kolanuts</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>Freshly sorted and wrapped in moisture-retaining organic leaves, packaged in aerated baskets or plastic crates.</p>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <strong>Shea Butter</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>Packed in 25kg food-grade plastic buckets, 100kg metal drums, or packaged directly in retail boxes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Destination Markets Banner */}
      <section style={{ padding: '60px 24px', background: '#0d2e1a', color: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Global Markets We Supply</h2>
          <p style={{ fontSize: '15px', color: '#d1f4df', maxWidth: '640px', margin: '0 auto 36px' }}>
            We serve food processing industries, cosmetics laboratories, pharmaceutical businesses, and ethnic wholesale markets globally.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="markets-grid">
            {[
              { region: 'Europe', countries: 'Germany, Netherlands, UK, France' },
              { region: 'North America', countries: 'United States, Canada' },
              { region: 'Asia', countries: 'China, India, Japan, Vietnam' },
              { region: 'Middle East', countries: 'UAE, Saudi Arabia, Qatar' }
            ].map((market, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#a3e2bb', margin: '0 0 8px' }}>{market.region}</h3>
                <p style={{ fontSize: '12px', color: '#d1f4df', margin: 0, lineHeight: 1.5 }}>{market.countries}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Trigger */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Initiate Export Quotation</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Contact our export desk today to request a Proforma Invoice (PI) detailing terms of trade, payment options, and shipping schedules.
          </p>
          <Link to="/contact?export=true" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '4px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Get FOB / CIF Quote
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 992px) {
          .export-flex {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .markets-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 576px) {
          .markets-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
