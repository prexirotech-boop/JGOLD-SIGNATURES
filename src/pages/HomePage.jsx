import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* ─── HERO SECTION ─── */}
      <section style={{ padding: '64px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '48px', alignItems: 'center' }} className="hero-grid">
          
          {/* Left Column: Headings & Subtexts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ 
              fontSize: '44px', 
              fontWeight: 800, 
              color: '#0d2e1a', 
              lineHeight: '1.18', 
              margin: 0,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-1px'
            }} className="hero-title">
              Connecting Nigeria's<br />
              <span style={{ color: 'var(--brand-primary)', display: 'block', margin: '4px 0' }}>Finest Agricultural Products</span>
              <span style={{ fontStyle: 'italic', fontWeight: '500', color: '#5cb57c', fontSize: '32px', display: 'block', marginTop: '6px' }}>to the Global Marketplace</span>
            </h1>
            
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0, maxWidth: '480px' }}>
              We source, process and export premium quality agricultural products from Nigeria to the world with integrity, quality and excellence.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }} className="hero-actions">
              <Link to="/products" style={{
                background: 'var(--brand-primary)',
                color: '#fff',
                padding: '13px 26px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
                 onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
                Explore Our Products <span>→</span>
              </Link>
              <Link to="/contact" style={{
                background: 'transparent',
                color: '#0d2e1a',
                border: '1px solid #0d2e1a',
                padding: '13px 26px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
                 onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                Contact Us <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Mockup-Exact collage image */}
          <div style={{ position: 'relative' }} className="hero-image-col">
            <div style={{
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.06)'
            }}>
              <img 
                src="/mifas_hero_image.png" 
                alt="Nigerian agricultural products" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── FEATURES HIGHLIGHTS STRIP (Green Background) ─── */}
      <section style={{ background: '#0d2e1a', color: '#ffffff', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="features-grid">
          {[
            {
              title: 'GLOBAL REACH',
              desc: 'We export to over 20+ countries worldwide.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V10a2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            },
            {
              title: 'PREMIUM QUALITY',
              desc: 'We maintain the highest quality from farm to final delivery.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            },
            {
              title: 'EXPORT READY',
              desc: 'We meet international standards and export requirements.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-4V17l8 4m0-12v10" />
            },
            {
              title: 'TRUSTED PARTNER',
              desc: 'Reliable, transparent and customer-focused service.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            },
            {
              title: 'SUSTAINABLE SOURCING',
              desc: 'Supporting local farmers and promoting sustainable agriculture.',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 12px' }}>
              <div style={{ color: '#a3e2bb', display: 'flex' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
              </div>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.5px' }}>{item.title}</strong>
              <p style={{ fontSize: '11px', color: '#d1f4df', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT US SECTION ─── */}
      <section style={{ padding: '64px 24px', background: '#fcfdfd' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2.5fr 1fr', gap: '32px', alignItems: 'center' }} className="about-wrapper">
          
          {/* Left Crop Image (Circle) */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="about-left-col">
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #d1f4df', boxShadow: '0 6px 16px rgba(0,0,0,0.04)' }}>
              <img src="/about_left.png" alt="Kolanuts basket" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* Center Text Column */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              ABOUT US
            </span>
            <div style={{ width: '40px', height: '2.5px', background: 'var(--brand-primary)', borderRadius: '2px', marginTop: '-4px' }} />
            
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.7', margin: 0, fontWeight: 550 }}>
              <strong>MIFAS FARMS LTD</strong> is a Nigerian agribusiness and export company specializing in the sourcing, processing, packaging and export of premium agricultural commodities.
            </p>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              We work directly with trusted farmers and producer groups to ensure consistent quality, traceability and sustainable sourcing. Our mission is to connect Nigeria's finest agricultural products to global markets through excellence and reliability.
            </p>
          </div>

          {/* Right Crop Image (Circle) */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="about-right-col">
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #d1f4df', boxShadow: '0 6px 16px rgba(0,0,0,0.04)' }}>
              <img src="/about_right.png" alt="Shea butter nuts" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

        </div>
      </section>

      {/* ─── PREMIUM PRODUCTS CATALOG ─── */}
      <section style={{ padding: '64px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }} className="section-header-flex">
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" strokeLinecap="round"/></svg>
              OUR PRODUCTS
            </span>
            <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
              Premium Agricultural Products
            </h2>
          </div>
          <Link to="/products" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '12.5px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            View All Products <span>→</span>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="products-grid">
          {[
            {
              title: 'Bitter Kola',
              sub: 'Export-grade Garcinia kola in bulk and retail packaging.',
              img: '/prod_bitter_kola.png',
              path: '/products?category=bitter-kola'
            },
            {
              title: 'Kolanuts',
              sub: 'Cola nitida & Cola acuminata. Fresh and export quality.',
              img: '/prod_kolanuts.png',
              path: '/products?category=kolanuts'
            },
            {
              title: 'Palm Oil',
              sub: 'Premium quality crude palm oil available in various packaging.',
              img: '/prod_palm_oil.png',
              path: '/products?category=palm-oil'
            },
            {
              title: 'Shea Butter',
              sub: 'Premium unrefined shea butter for food and cosmetic use.',
              img: '/prod_shea_butter.png',
              path: '/products?category=shea-butter'
            },
            {
              title: 'Other Products',
              sub: 'Hibiscus Flower, Aidan Fruit, Alligator Pepper, Uziza Seeds and more.',
              img: '/prod_other.png',
              path: '/products'
            }
          ].map((prod, idx) => (
            <div key={idx} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
              transition: 'all 0.2s ease'
            }} className="product-card-hover">
              
              <div style={{ height: '110px', overflow: 'hidden', background: '#f8fafc' }}>
                <img 
                  src={prod.img} 
                  alt={prod.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 6px' }}>
                    {prod.title}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.45', margin: 0 }}>
                    {prod.sub}
                  </p>
                </div>
                <Link to={prod.path} style={{
                  color: 'var(--brand-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }} className="card-link-hover">
                  Learn More <span>→</span>
                </Link>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS & CALL TO ACTION SECTION (Green Background) ─── */}
      <section style={{ background: '#0d2e1a', color: '#ffffff', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }} className="cta-wrapper">
          
          {/* Left Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }} className="stats-grid">
            {[
              { val: '100%', label: 'NATURAL Products', icon: <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { val: '20+', label: 'COUNTRIES We Export To', icon: <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
              { val: '500+', label: 'SATISFIED Customers', icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
              { val: 'EXPORT READY', label: 'Packaging & Documentation', icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-4V17l8 4m0-12v10" /> },
              { val: 'QUALITY ASSURED', label: 'International Standards', icon: <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> }
            ].map((stat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ color: '#a3e2bb', display: 'flex' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">{stat.icon}</svg>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>{stat.val}</div>
                <div style={{ fontSize: '10px', color: '#d1f4df', lineHeight: '1.3', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Right CTA Card with Whatsapp Contact Details */}
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            color: '#1e293b',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e2fdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#14b8a6',
                flexShrink: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <strong style={{ fontSize: '16px', color: '#0d2e1a', fontWeight: 800 }}>Let's Work Together</strong>
            </div>
            
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Partner with us for reliable supply of premium Nigerian agricultural products. We handle all logistics, phytosanitary checks, and customs clearing documentation.
            </p>

            <Link to="/contact" style={{
              background: 'var(--brand-primary)',
              color: '#ffffff',
              padding: '11px 20px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'background-color 0.2s',
              display: 'block'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
               onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
              Get in Touch <span>→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ─── HOVER STYLES & INTERACTION ─── */}
      <style>{`
        .product-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.04) !important;
          border-color: var(--brand-primary) !important;
        }
        .card-link-hover:hover {
          text-decoration: underline !important;
        }
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center;
          }
          .hero-title {
            font-size: 36px !important;
          }
          .hero-actions {
            justify-content: center;
          }
          .hero-image-col {
            max-width: 440px;
            margin: 0 auto;
          }
          .features-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .cta-wrapper {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .about-wrapper {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .about-left-col, .about-right-col {
            display: none !important;
          }
          .products-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}