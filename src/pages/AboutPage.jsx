import React from 'react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  const stats = [
    { value: '100%', label: 'Organic Sourced' },
    { value: '20+', label: 'Export Countries' },
    { value: '500+', label: 'Satisfied Buyers' },
    { value: 'Enugu', label: 'Processing Hub' }
  ]

  const pillars = [
    { 
      title: 'Farm Gate Sourcing', 
      desc: 'We buy commodities directly from trained cooperative farmers, ensuring stable pricing and organic standards.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    { 
      title: 'Manual Selection', 
      desc: 'We sort batches by hand in our clean Enugu processing hub. Bad or undersized products are filtered out.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      )
    },
    { 
      title: 'Moisture Calibration', 
      desc: 'We perform strict moisture levels tests to guarantee transit shelf life and prevent mold growth.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    { 
      title: 'NAQS Clearance', 
      desc: 'We handle export custom declarations and phytosanitary clearance before container dispatch.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    }
  ]

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Who We Are
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Empowering Farmers & Exporting Quality
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            MIFAS FARMS LTD is a premier agribusiness dedicated to bridging the gap between local farming cooperatives in Nigeria and premium international trade buyers.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '40px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }} className="stats-row">
          {stats.map((st, idx) => (
            <div key={idx} style={{ padding: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: 850, color: 'var(--brand-primary)' }}>{st.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content (Story) */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }} className="about-split-row">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, marginBottom: '20px' }}>The Story of MIFAS FARMS</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Founded with a mission to elevate the global value of Nigerian agricultural treasures, MIFAS FARMS LTD was established to fix supply-chain inconsistencies in raw crop exports.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Our operational hub in Maryland, Enugu, coordinates sorting, drying calibration, and packing. By partnering directly with farmers, we guarantee fair trade wages, prevent mid-level exploitation, and secure consistent, premium batches for our international buyers in the Americas, Europe, and Asia.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Whether you are sourcing Bitter Kola, Kolanuts, Palm Oil, or Shea Butter, we guarantee fully verified customs clearances and inspection certificates.
            </p>
          </div>
          <div>
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #a3e2bb',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 16px rgba(18,60,36,0.03)'
            }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: '#246a42', opacity: 0.2, lineHeight: 0.1, display: 'block', marginBottom: '10px' }}>“</span>
              <p style={{ fontSize: '15px', color: '#1b5333', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 16px' }}>
                Sustainable agriculture is not just about farming. It's about developing standard inspection channels so that local harvests gain the international leverage they deserve.
              </p>
              <div>
                <strong style={{ display: 'block', fontSize: '14.5px', color: '#0d2e1a' }}>MIFAS Management Board</strong>
                <span style={{ fontSize: '12.5px', color: '#246a42' }}>Logistics & Quality Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Pillars Grid */}
      <section style={{ padding: '80px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: '0 0 8px' }}>Our Core Pillars</h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>How we maintain quality standards across every export cycle.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="pillars-grid">
            {pillars.map((pil, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ color: 'var(--brand-primary)' }}>
                  {pil.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0d2e1a', margin: 0 }}>{pil.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{pil.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Request Wholesale Quotations</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Submit your cargo quantity specs, packaging preferences, and destination port to receive a Free On Board (FOB) price quotation.
          </p>
          <Link to="/contact" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Get a Quote Now
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 992px) {
          .pillars-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .about-split-row {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 576px) {
          .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
