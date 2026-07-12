import React from 'react'
import { Link } from 'react-router-dom'

export default function QualityPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            International Standards
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Quality Assurance & Certifications
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            At MIFAS FARMS, quality is not an afterthought. We maintain rigorous quality assurance frameworks from soil management to export clearance to ensure our buyers receive premium commodities.
          </p>
        </div>
      </section>

      {/* Quality Pillars Grid */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800 }}>Our Quality Pillars</h2>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Four stages of strict checks before packaging and container loading.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="quality-grid">
          {[
            {
              num: '01',
              title: 'Source Inspection',
              desc: 'We work directly with trained farmers. Moisture content and organic agricultural practices are audited right at the farm gate.'
            },
            {
              num: '02',
              title: 'Standard Sorting',
              desc: 'Commodities are transported to our clean Enugu sorting facility. Discolored, undersized, or damaged nuts/seeds are sorted out manually.'
            },
            {
              num: '03',
              title: 'Lab Moisture Analysis',
              desc: 'Ensuring correct moisture percentage is critical to prevent mold during maritime transit. We run moisture calibration checks for every batch.'
            },
            {
              num: '04',
              title: 'Phytosanitary Clearance',
              desc: 'Official inspection and approval by the Nigerian Agricultural Quarantine Service (NAQS) prior to customs documentation.'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-primary)', opacity: 0.15 }}>{item.num}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0d2e1a', margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications & Compliances banner */}
      <section style={{ padding: '60px 24px', background: '#f0fdf4', borderTop: '1px solid #d1f4df', borderBottom: '1px solid #d1f4df' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="cert-flex">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, marginBottom: '16px' }}>Compliance & Food Safety</h2>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', marginBottom: '12px' }}>
              MIFAS FARMS agricultural commodities meet strict European Food Safety Authority (EFSA) limits and US FDA guidelines.
            </p>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              All shipments carry accredited laboratory testing analysis reports for aflatoxins, pesticide residues, and moisture specifications.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              'NAQS Certified',
              'SGS Inspection Available',
              'HACCP Standard Compliant',
              'FDA Registered Facility'
            ].map((text, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1.5px solid #a3e2bb',
                borderRadius: '6px',
                padding: '16px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '13.5px',
                color: 'var(--brand-primary)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Request Certificate Samples</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            We provide laboratory reports, moisture analyses, and NAQS test receipts to verified buyers upon quotation requests.
          </p>
          <Link to="/contact" style={{
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
            Get a Quote Now
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 992px) {
          .quality-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .cert-flex {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 576px) {
          .quality-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
