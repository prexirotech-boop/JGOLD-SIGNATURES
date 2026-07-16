import React from 'react'
import { Link } from 'react-router-dom'

export default function QualityPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#c5a880', textTransform: 'uppercase', letterSpacing: '2px' }}>
            International Standards
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Quality Assurance & Craftsmanship
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            At JGOLD SIGNATURES, quality is a promise. We maintain rigorous standards from premium leather sourcing to final packaging to ensure our clients receive exquisite products.
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
              title: 'Leather Selection',
              desc: 'We source only premium full-grain Italian leathers and premium fabrics, auditing textures and durability metrics.'
            },
            {
              num: '02',
              title: 'Master Stitching',
              desc: 'Footwear is handcrafted by master artisans. Stitching tension, alignment, and cuts are manually checked for perfection.'
            },
            {
              num: '03',
              title: 'Fit & Comfort Audit',
              desc: 'Ensuring correct sizing and cushioning is critical. We perform strict walking and flexibility checks for every product.'
            },
            {
              num: '04',
              title: 'Elegance Packaging',
              desc: 'Every item is hand-packed in protective custom dust bags and rigid signature boxes before shipment.'
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
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f0d0a', margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications & Compliances banner */}
      <section style={{ padding: '60px 24px', background: '#faf8f5', borderTop: '1px solid #e3d5c1', borderBottom: '1px solid #e3d5c1' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="cert-flex">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0f0d0a', fontWeight: 800, marginBottom: '16px' }}>Premium Sourcing & Safety</h2>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', marginBottom: '12px' }}>
              JGOLD SIGNATURES products meet strict international craftsmanship guidelines and ethical sourcing audits.
            </p>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              All footwear batches carry premium stitching guarantees, comfort cushioning reports, and genuine leather certificates.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              '100% Genuine Leather',
              'Artisan Handcrafted',
              'Ethically Sourced',
              'Premium Packaging'
            ].map((text, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1.5px solid #c5a880',
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
          <h2 style={{ fontSize: '28px', color: '#0f0d0a', fontWeight: 800, margin: 0 }}>Discover Luxury Sizing</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Explore our catalog online to view sizing guidelines, detailed materials reviews, and select your signature pieces.
          </p>
          <Link to="/products" style={{
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
            Explore Products
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
