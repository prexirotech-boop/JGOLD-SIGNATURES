import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation()
  const [subscribed, setSubscribed] = useState(false)
  const [email, setEmail] = useState('')

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

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #030712 0%, #0b1329 100%)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      fontFamily: 'var(--font)',
      position: 'relative',
      overflow: 'hidden',
      color: '#f8fafc'
    }}>


      {/* Modern Ambient Radial Glow Spotlights */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '5%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        right: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Main Footer Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 40px 48px'
      }}>
        {/* Footer Navigation & Brand Columns */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 2.5fr) 1.2fr 1.2fr 2fr',
          gap: '64px 48px'
        }}>
          
          {/* Column 1: Brand & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Logo Wrapper to prevent stretching */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: 48,
              width: '100%',
              flexShrink: 0
            }}>
              <img
                src="/logo.png"
                alt="Amplified Skills"
                onClick={scrollToTop}
                style={{
                  height: '100%',
                  width: 'auto',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255,255,255,0.05))',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              />
            </div>

            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8,
              maxWidth: 320,
              margin: 0
            }}>
              Accelerating professional careers through elite, masterclass-level training modules and actionable blueprints.
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {[
                { label: 'Instagram', url: '#', svg: <><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.8"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="1.8"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></> },
                { label: 'X', url: '#', svg: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.213 5.567L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="currentColor" strokeWidth="0"/> },
                { label: 'YouTube', url: '#', svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" strokeWidth="1.8"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></> },
                { label: 'LinkedIn', url: '#', svg: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" strokeWidth="1.8"/><rect x="2" y="9" width="4" height="12" strokeWidth="1.8"/><circle cx="4" cy="4" r="2" strokeWidth="1.8"/></> }
              ].map(({ label, url, svg }) => (
                <a key={label} href={url} aria-label={label} className="footer-social-link"
                   style={{
                     width: 36,
                     height: 36,
                     borderRadius: '50%',
                     background: 'rgba(255,255,255,0.03)',
                     border: '1px solid rgba(255,255,255,0.08)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: 'rgba(255,255,255,0.5)',
                     textDecoration: 'none',
                     transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">{svg}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: 20,
              fontFamily: 'var(--font-sub)'
            }}>Programs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'All Courses', path: '/products' },
                { label: 'Blueprints', path: '/products?type=blueprint' },
                { label: 'E-Books', path: '/products?type=ebook' },
                { label: 'FAQs & Help', path: '/faq' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} onClick={scrollToTop} className="footer-nav-link"
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: 20,
              fontFamily: 'var(--font-sub)'
            }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Refund Policy', path: '/refund' },
                { label: 'Student Support', path: '/contact' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} onClick={scrollToTop} className="footer-nav-link"
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '14px',
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

          {/* Column 4: Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: 4,
              fontFamily: 'var(--font-sub)'
            }}>Stay Informed</h4>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6,
              margin: 0
            }}>
              Join our mailing list to receive exclusive pricing codes, course updates, and skill-building guides.
            </p>
            
            {subscribed ? (
              <div style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#34d399',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Awesome! Check your inbox soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-form" style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '4px',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13.5px',
                    padding: '8px 12px',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'var(--font)'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.boxShadow = '0 0 12px rgba(37,99,235,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  Join
                </button>
              </form>
            )}

            {/* Paystack and security assurance badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 8,
              padding: '8px 12px',
              width: 'fit-content'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Secure payments by <strong>Paystack</strong></span>
            </div>
          </div>
        </div>

        {/* Disclaimer / Meta Affiliate Note */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          marginTop: 64,
          paddingTop: 24,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.22)',
            lineHeight: 1.7,
            maxWidth: 720,
            margin: '0 auto'
          }}>
            Disclaimer: This site is not a part of the Meta website or Meta Platforms, Inc. Additionally, this site is NOT endorsed by Meta in any way. META is a trademark of META PLATFORMS, INC.
          </p>
        </div>
      </div>

      {/* Bottom Legal Copyright Bar */}
      <div style={{
        background: '#020617',
        borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            &copy; {year} <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Amplified Skills</strong>. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Terms', 'Privacy', 'Refunds'].map(txt => {
              const path = txt === 'Terms' ? '/terms' : txt === 'Privacy' ? '/privacy' : '/refund';
              return (
                <Link key={txt} to={path} onClick={scrollToTop} className="footer-bottom-link"
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.3)',
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

      {/* Inline animations & responsive behaviors */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .footer-social-link:hover {
          background: rgba(37,99,235,0.15) !important;
          border-color: rgba(37,99,235,0.4) !important;
          color: #3b82f6 !important;
          transform: translateY(-2px);
        }
        .footer-nav-link {
          transition: transform 0.2s ease, color 0.2s ease !important;
        }
        .footer-nav-link:hover {
          color: #fff !important;
          transform: translateX(4px);
        }
        .footer-bottom-link:hover {
          color: rgba(255,255,255,0.65) !important;
        }
        .footer-form:focus-within {
          border-color: rgba(37,99,235,0.4) !important;
          box-shadow: 0 0 16px rgba(37,99,235,0.1);
        }
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1fr 1fr !important;
            gap: 48px !important;
          }
          .footer-grid > div:last-child {
            grid-column: span 3;
            max-width: 480px;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .footer-grid > div:last-child {
            grid-column: span 1;
          }
          div[style*="padding: 80px 40px 48px"] {
            padding: 48px 24px 32px !important;
          }
          div[style*="padding: 24px 40px"] {
            padding: 20px 24px !important;
            flex-direction: column;
            text-align: center;
            justify-content: center !important;
          }
        }
      `}</style>
    </footer>
  )
}
