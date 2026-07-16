import React from 'react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  const stats = [
    { value: '100%', label: 'Premium Quality' },
    { value: 'Nationwide', label: 'Express Shipping' },
    { value: '5000+', label: 'Dapper Gentlemen' },
    { value: 'Lagos', label: 'Luxury Showroom' }
  ]

  const pillars = [
    { 
      title: 'Premium Materials', 
      desc: 'We source only top-grade, full-grain Italian leathers and premium materials, ensuring maximum comfort and durability.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    },
    { 
      title: 'Master Craftsmanship', 
      desc: 'Each pair of shoes is meticulously shaped and stitched by hand, combining traditional techniques with contemporary cuts.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    { 
      title: 'Detail Inspection', 
      desc: 'We perform strict double-pass quality control reviews to verify fit, finish, and sole attachment before packing.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    { 
      title: 'Luxury Packaging', 
      desc: 'Every order is beautifully hand-packaged in protective custom velvet dust bags and premium signature rigid boxes.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      )
    }
  ]

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#c5a880', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Who We Are
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Luxury, Craftsmanship & Modern Style
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            JGOLD SIGNATURES is a premier men's luxury brand dedicated to offering dapper gentlemen exquisite footwear and elegant fashion accessories.
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
            <h2 style={{ fontSize: '28px', color: '#0f0d0a', fontWeight: 800, marginBottom: '20px' }}>The Story of JGOLD SIGNATURES</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Welcome to JGOLD, where luxury meets style. At JGOLD, we believe that every man deserves to shine like a star. Our curated collection of exquisite shoes and elegant clothing accessories is designed to empower men to express their unique style with confidence and grace.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Our brand coordinates everything from design to handcrafted creation. Located in Mandelas, Lagos State, our showroom is a hub for classic styles and modern trends. Each item in our collection is meticulously crafted from the finest materials, ensuring both comfort and durability.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Whether you’re looking for the perfect pair of shoes to complement your evening attire or a statement accessory to elevate your everyday look, JGOLD has you covered. Join us on a journey of sophistication and glamour. Discover the perfect pieces that will make you stand out and feel fabulous, only at JGOLD. Because at JGOLD, you are the star.
            </p>
          </div>
          <div>
            <div style={{
              background: '#faf8f5',
              border: '1.5px solid #c5a880',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 16px rgba(197,168,128,0.03)'
            }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: '#c5a880', opacity: 0.2, lineHeight: 0.1, display: 'block', marginBottom: '10px' }}>“</span>
              <p style={{ fontSize: '15px', color: '#5c4e3c', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 16px' }}>
                Every man deserves to shine like a star. Our mission is to design footwear and accessories that combine comfort, luxury, and unmatched confidence.
              </p>
              <div>
                <strong style={{ display: 'block', fontSize: '14.5px', color: '#0f0d0a' }}>JGOLD Design Board</strong>
                <span style={{ fontSize: '12.5px', color: '#c5a880' }}>Craftsmanship & Product Integrity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Pillars Grid */}
      <section style={{ padding: '80px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 8px' }}>Our Core Pillars</h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>How we maintain luxury standards across every handmade product.</p>
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
          <h2 style={{ fontSize: '28px', color: '#0f0d0a', fontWeight: 800, margin: 0 }}>Discover Your Perfect Fit</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Explore our premium selection of shoes, belts, cufflinks, and elegant clothing accessories. Find your fit online or chat with our team.
          </p>
          <Link to="/products" style={{
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
            Explore Products Now
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
