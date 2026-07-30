import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation()

  const hideFooterOn = [
    '/dashboard',
    '/setup-account',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/checkout',
    '/free-training'
  ]

  const shouldHide = hideFooterOn.some(path => location.pathname === path) || location.pathname.startsWith('/course')
  if (shouldHide) return null

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: '#0f0d0a', // Solid dark charcoal luxury brand color
      fontFamily: 'var(--font)',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff',
      borderTop: '4px solid #c5a880' // Gold accent border
    }}>

      {/* Main Footer Container */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '64px 24px 40px'
      }}>
        {/* Footer Navigation & Brand Columns */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.2fr 1.2fr 1.8fr 1fr',
          gap: '40px 32px'
        }}>
          
          {/* Column 1: Brand & Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/logo.webp"
                alt="JGOLD SIGNATURES"
                onClick={scrollToTop}
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  filter: 'brightness(0) invert(1)' // Renders the logo in clean white
                }}
              />
            </div>

            <p style={{
              fontSize: '13px',
              color: '#f4eee3',
              lineHeight: 1.6,
              margin: 0
            }}>
              Welcome to JGOLD, where luxury meets style. Our curated collection of exquisite shoes and elegant clothing accessories is designed to empower men to express their unique style with confidence and grace.
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {[
                { label: 'Facebook', url: '#', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/> },
                { label: 'Instagram', url: '#', svg: <><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.8"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="1.8"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></> },
                { label: 'LinkedIn', url: '#', svg: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" strokeWidth="1.8"/><rect x="2" y="9" width="4" height="12" strokeWidth="1.8"/><circle cx="4" cy="4" r="2" strokeWidth="1.8"/></> },
                { label: 'X', url: '#', svg: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.213 5.567L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="currentColor" strokeWidth="0"/> }
              ].map(({ label, url, svg }) => (
                <a key={label} href={url} aria-label={label} className="footer-social-link"
                   style={{
                     width: 32,
                     height: 32,
                     borderRadius: '50%',
                     background: 'rgba(255,255,255,0.06)',
                     border: '1px solid rgba(255,255,255,0.1)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#f4eee3',
                     textDecoration: 'none',
                     transition: 'all 0.2s ease'
                   }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svg}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#c5a880',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 16
            }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Products', path: '/products' },
                { label: 'Quality', path: '/quality' },
                { label: 'FAQs', path: '/faq' },
                { label: 'Contact', path: '/contact' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} onClick={scrollToTop} className="footer-nav-link"
                  style={{
                    color: '#e3d5c1',
                    fontSize: '13.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Products */}
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#c5a880',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 16
            }}>Collection</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Exquisite Shoes', path: '/products?category=shoes' },
                { label: 'Men\'s Apparel', path: '/products?category=apparel' },
                { label: 'Elegant Accessories', path: '/products?category=accessories' },
                { label: 'New Arrivals', path: '/products' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} onClick={scrollToTop} className="footer-nav-link"
                  style={{
                    color: '#e3d5c1',
                    fontSize: '13.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#c5a880',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 4
            }}>Contact Us</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px', color: '#e3d5c1' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>+234 705 929 7121<br/>+234 803 971 4352</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ wordBreak: 'break-all' }}>ebonyjuliet15@yahoo.com</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>jgoldsignatures.com.ng</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Shop 2F08 Update plaza, second floor Mandelas, Lagos State, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Column 5: Proudly Nigerian Map Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            {/* Outline Map Icon / Compass Indicator */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px dashed #c5a880',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c5a880'
            }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Luxury & Style,</div>
            <div style={{ fontSize: '11.5px', color: '#c5a880', fontWeight: 600 }}>Crafted for You.</div>
          </div>

        </div>

        {/* Bottom Legal Copyright Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 48,
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <p style={{ fontSize: '12.5px', color: '#c5a880', margin: 0 }}>
            &copy; {year} <strong style={{ color: '#ffffff', fontWeight: 700 }}>JGOLD SIGNATURES</strong>. All Rights Reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Terms of Service', 'Privacy Policy', 'Refund Policy'].map(txt => {
              const path = txt.includes('Terms') ? '/terms' : txt.includes('Privacy') ? '/privacy' : '/refund';
              return (
                <Link key={txt} to={path} onClick={scrollToTop} className="footer-bottom-link"
                  style={{
                    fontSize: '12.5px',
                    color: '#c5a880',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                >
                  {txt}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Styles & Transitions */}
      <style>{`
        .footer-social-link:hover {
          background: var(--brand-primary) !important;
          border-color: #c5a880 !important;
          color: #ffffff !important;
          transform: translateY(-2px);
        }
        .footer-nav-link:hover {
          color: #ffffff !important;
          transform: translateX(4px);
          font-weight: 600;
        }
        .footer-bottom-link:hover {
          color: #ffffff !important;
        }
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 40px 32px !important;
          }
          .footer-grid > div:first-child {
            grid-column: span 2;
          }
          .footer-grid > div:last-child {
            grid-column: span 2;
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .footer-grid > div:first-child,
          .footer-grid > div:last-child {
            grid-column: span 1;
          }
        }
      `}</style>
    </footer>
  )
}
