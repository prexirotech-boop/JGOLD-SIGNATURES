import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function getShortDesc(product) {
  if (!product) return ''
  const desc = product.description || ''
  if (!desc) return ''
  if (desc.includes('<')) {
    const plainText = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
  }
  return desc.length > 100 ? desc.substring(0, 100) + '...' : desc
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, cover_image, price, old_price, description, variations, type')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(8)
        if (data) setFeaturedProducts(data)
      } catch (err) {
        console.error('[HomePage] Failed to load products:', err)
      } finally {
        setProductsLoading(false)
      }
    }
    loadFeaturedProducts()
  }, [])

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* ─── HERO SECTION ─── */}
      <section style={{ padding: 0, width: '100%', maxWidth: '100%', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        
        {/* Leaf image overlays for decoration */}
        <div style={{ position: 'absolute', top: '-15px', left: '-15px', opacity: 0.25, zIndex: 1, pointerEvents: 'none' }} className="hero-leaf-tl">
          <img src="/leaf.png" alt="botanical leaf decoration" style={{ width: '100px', height: 'auto', transform: 'rotate(-25deg) scaleX(-1)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '0px', left: '-25px', opacity: 0.35, zIndex: 1, pointerEvents: 'none' }} className="hero-leaf-bl">
          <img src="/leaf.png" alt="botanical leaf decoration" style={{ width: '140px', height: 'auto', transform: 'rotate(15deg)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', alignItems: 'center', width: '100%' }} className="hero-grid">
          
          {/* Left Column: Headings & Subtexts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '120px 24px 120px max(8%, 32px)', position: 'relative', zIndex: 2 }} className="hero-left-col">
            <h1 style={{ 
              fontSize: '52px', 
              fontWeight: 800, 
              color: '#0d2e1a', 
              lineHeight: '1.25', 
              margin: 0,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-1px'
            }} className="hero-title">
              Connecting Nigeria's<br />
              Finest Agricultural Products<br />
              <span style={{ 
                fontFamily: "'Dancing Script', 'Brush Script MT', cursive", 
                fontWeight: '600', 
                color: '#246a42', 
                fontSize: '48px', 
                display: 'block', 
                marginTop: '8px' 
              }}>to the Global Marketplace</span>
            </h1>
            
            <p style={{ fontSize: '17.5px', color: '#475569', lineHeight: '1.8', margin: 0, maxWidth: '560px' }}>
              We source, process and export premium quality agricultural products from Nigeria to the world with integrity, quality and excellence.
            </p>

            <div style={{ display: 'flex', gap: '18px', marginTop: '8px' }} className="hero-actions">
              <Link to="/products" style={{
                background: '#0d2e1a',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                border: '1px solid #0d2e1a'
              }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#123c24'}
                 onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d2e1a'}>
                Explore Our Products <span>→</span>
              </Link>
              <Link to="/contact" style={{
                background: 'transparent',
                color: '#0d2e1a',
                border: '1px solid #0d2e1a',
                padding: '16px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                 onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                Contact Us <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Borderless and Seamless Hero Image */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: '#ffffff' }} className="hero-image-col">
            <img 
              src="/mifas_hero_image.png" 
              alt="Nigerian premium agricultural products collage" 
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            />
          </div>

        </div>

        {/* Local responsiveness stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1024px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
            }
            .hero-left-col {
              padding: 70px 24px 50px !important;
              text-align: center !important;
              align-items: center !important;
            }
            .hero-left-col p {
              margin: 0 auto !important;
            }
            .hero-image-col {
              justify-content: center !important;
              padding: 0 24px 60px !important;
            }
            .hero-image-col img {
              max-width: 90% !important;
            }
            .hero-title {
              font-size: 38px !important;
            }
            .hero-title span {
              font-size: 34px !important;
            }
            .hero-leaf-tl, .hero-leaf-bl {
              display: none !important;
            }
          }
        `}} />
      </section>

      {/* ─── FEATURES HIGHLIGHTS STRIP (Green Background) ─── */}
      <section style={{ background: '#0d2e1a', color: '#ffffff', padding: '40px 24px', width: '100%', maxWidth: '100%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }} className="features-grid-new">
          {[
            {
              title: 'GLOBAL REACH',
              desc: 'We export to over 20+ countries worldwide.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
              )
            },
            {
              title: 'PREMIUM QUALITY',
              desc: 'We maintain the highest quality from farm to final delivery.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  <polyline points="9 8 11 10 15 6"/>
                </svg>
              )
            },
            {
              title: 'EXPORT READY',
              desc: 'We meet international standards and export requirements.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21.5 12V5.5L12 1.5 2.5 5.5V12c0 5.25 4 10.12 9.5 12 5.5-1.88 9.5-6.75 9.5-12z"/>
                  <polyline points="8 11.5 11 14.5 16 9.5"/>
                </svg>
              )
            },
            {
              title: 'TRUSTED PARTNER',
              desc: 'Reliable, transparent and customer-focused service.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )
            },
            {
              title: 'SUSTAINABLE SOURCING',
              desc: 'Supporting local farmers and promoting sustainable agriculture.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c0 5-1.5 9-6.1 14.8A7 7 0 0 1 11 20z"/>
                  <path d="M9 22v-4"/>
                </svg>
              )
            }
          ].map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: '16px', 
              paddingRight: idx < 4 ? '16px' : '0', 
              borderRight: idx < 4 ? '1px solid rgba(255,255,255,0.15)' : 'none' 
            }} className="features-item-new">
              {item.icon}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff' }}>{item.title}</strong>
                <p style={{ fontSize: '11px', color: '#d1f4df', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT US SECTION ─── */}
      <section style={{ padding: '80px 24px', background: '#fcfdfd', width: '100%', maxWidth: '100%', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2.2fr 1fr', gap: '48px', alignItems: 'center' }} className="about-wrapper-new">
          
          {/* Left Crop Image (Circle) */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="about-left-circle-col">
            <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: '5px solid #246a42', boxShadow: '0 8px 24px rgba(36,106,66,0.12)', transition: 'transform 0.3s ease' }} className="about-circle-container">
              <img src="/about_left.png" alt="Kolanuts basket" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* Center Text Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center' }} className="about-text-col">
            
            {/* Header with horizontal lines and leaf */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', width: '100%' }}>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#e2e8f0', maxWidth: '80px' }} className="about-header-line" />
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '800', 
                color: '#246a42', 
                textTransform: 'uppercase', 
                letterSpacing: '2px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c0 5-1.5 9-6.1 14.8A7 7 0 0 1 11 20z" />
                </svg>
                ABOUT US
              </span>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#e2e8f0', maxWidth: '80px' }} className="about-header-line" />
            </div>
            
            <p style={{ fontSize: '15.5px', color: '#1e293b', lineHeight: '1.7', margin: 0, fontWeight: 700 }}>
              MIFAS FARMS LTD is a Nigerian agribusiness and export company specializing in the sourcing, processing, packaging and export of premium agricultural commodities.
            </p>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.75', margin: 0 }}>
              We work directly with trusted farmers and producer groups to ensure consistent quality, traceability and sustainable sourcing. Our mission is to connect Nigeria's finest agricultural products to global markets through excellence and reliability.
            </p>
          </div>

          {/* Right Crop Image (Circle) */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="about-right-circle-col">
            <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: '5px solid #246a42', boxShadow: '0 8px 24px rgba(36,106,66,0.12)', transition: 'transform 0.3s ease' }} className="about-circle-container">
              <img src="/about_right.png" alt="Shea butter nuts" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

        </div>

        {/* Local styling overrides for features strip and about us sections responsiveness */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1100px) {
            .features-grid-new {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 20px !important;
            }
            .features-item-new {
              border-right: none !important;
              padding-right: 0 !important;
            }
          }
          @media (max-width: 900px) {
            .about-wrapper-new {
              display: flex !important;
              flex-direction: column !important;
              gap: 32px !important;
            }
            .about-left-circle-col {
              order: 1 !important;
            }
            .about-text-col {
              order: 2 !important;
            }
            .about-right-circle-col {
              order: 3 !important;
            }
            .about-circle-container {
              width: 180px !important;
              height: 180px !important;
            }
          }
          @media (max-width: 640px) {
            .features-grid-new {
              grid-template-columns: 1fr !important;
            }
            .about-circle-container {
              width: 150px !important;
              height: 150px !important;
            }
          }
        `}} />
      </section>

      {/* ─── PREMIUM PRODUCTS CATALOG ─── */}
      <section style={{ padding: '80px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }} className="section-header-flex">
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#246a42', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c0 5-1.5 9-6.1 14.8A7 7 0 0 1 11 20z" />
              </svg>
              OUR PRODUCTS
            </span>
            <h2 style={{ fontSize: '34px', color: '#0d2e1a', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }} className="products-section-title">
              Premium Agricultural Products
            </h2>
          </div>
          <Link to="/products" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '14px',
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

        {productsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="products-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '140px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '16px', background: '#f1f5f9', width: '70%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '12px', background: '#f1f5f9', width: '50%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <p style={{ margin: 0 }}>Products coming soon. Check back shortly!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="products-grid">
            {featuredProducts.map(prod => {
              let displayPrice = prod.price
              let displayOldPrice = prod.old_price
              const hasVariants = prod.variations?.variants && prod.variations.variants.length > 0
              if (hasVariants) {
                const prices = prod.variations.variants.map(v => v.price).filter(Boolean)
                if (prices.length > 0) {
                  displayPrice = Math.min(...prices)
                  const cheapestVariant = prod.variations.variants.find(v => v.price === displayPrice)
                  displayOldPrice = cheapestVariant?.compare_price || null
                }
              }
              const discount = displayOldPrice && displayPrice
                ? Math.round((1 - displayPrice / displayOldPrice) * 100)
                : null

              return (
                <div key={prod.id} style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }} className="product-card-hover">

                  {/* Discount badge */}
                  {discount && (
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: '#16a34a', color: '#fff',
                      fontSize: '10px', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '4px', zIndex: 5
                    }}>{discount}% OFF</span>
                  )}

                  {/* Card Image */}
                  <Link to={`/product/${prod.slug || prod.id}`} style={{ display: 'block', height: '160px', overflow: 'hidden', background: '#f8fafc' }}>
                    <img
                      src={prod.cover_image || '/logo.png'}
                      alt={prod.title.replace(/\s+slug$/i, '')}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.src = '/logo.png'; e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.padding = '20px' }}
                    />
                  </Link>

                  {/* Card Content */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <Link to={`/product/${prod.slug || prod.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 6px', lineHeight: '1.3' }}>
                          {prod.title.replace(/\s+slug$/i, '')}
                        </h3>
                      </Link>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                        {getShortDesc(prod)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0d2e1a' }}>
                          {hasVariants ? 'From ' : ''}₦{displayPrice?.toLocaleString()}
                        </span>
                        {displayOldPrice && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₦{displayOldPrice?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Link to={`/product/${prod.slug || prod.id}`} style={{
                        background: 'var(--brand-primary)',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'block',
                        transition: 'background-color 0.15s ease'
                      }} className="card-btn-hover">
                        Buy Now →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── STATS & CALL TO ACTION SECTION (Green Background) ─── */}
      <section style={{ background: '#0d2e1a', color: '#ffffff', padding: '80px 24px', width: '100%', maxWidth: '100%' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '48px', alignItems: 'center' }} className="cta-wrapper">
          
          {/* Left Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }} className="stats-grid-new">
            {[
              { 
                val: '100%', 
                label: 'Natural Products', 
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c0 5-1.5 9-6.1 14.8A7 7 0 0 1 11 20z" />
                    <path d="M9 22v-4" />
                  </svg>
                )
              },
              { 
                val: '20+', 
                label: 'Countries We Export To', 
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                    <path d="M2 12h20"/>
                  </svg>
                )
              },
              { 
                val: '500+', 
                label: 'Satisfied Customers', 
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              { 
                val: 'EXPORT READY', 
                label: 'Packaging & Documentation', 
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16.5 9.4 7.5 4.21 12 1.5 21.5 7 16.5 9.4" />
                    <polyline points="7.5 4.21 2.5 7 12 12 21.5 7" />
                    <line x1="2.5" y1="7" x2="2.5" y2="17.5" />
                    <polyline points="2.5 17.5 12 22.5 12 12" />
                    <line x1="12" y1="22.5" x2="21.5" y2="17.5" />
                    <line x1="21.5" y1="17.5" x2="21.5" y2="7" />
                  </svg>
                )
              },
              { 
                val: 'QUALITY ASSURED', 
                label: 'International Standards', 
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    <polyline points="9 8 11 10 15 6"/>
                  </svg>
                )
              }
            ].map((stat, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: '12px',
                paddingRight: idx < 4 ? '16px' : '0', 
                borderRight: idx < 4 ? '1px solid rgba(255,255,255,0.15)' : 'none'
              }} className="stats-item-new">
                <div style={{ color: '#f59e0b', display: 'flex', flexShrink: 0 }}>
                  {stat.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: '1.2' }}>{stat.val}</div>
                  <div style={{ fontSize: '11px', color: '#d1f4df', lineHeight: '1.3', fontWeight: 600 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right CTA Card with Whatsapp Contact Details */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            color: '#1e293b',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }} className="cta-card-new">
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.978L2 22l5.197-1.361a9.94 9.94 0 0 0 4.814 1.238h.005c5.503 0 9.987-4.479 9.988-9.985a9.97 9.97 0 0 0-2.925-7.062 9.96 9.96 0 0 0-7.067-2.83zm5.73 14.103c-.236.662-1.362 1.217-1.888 1.286-.475.06-1.085.126-3.2-.75a10.963 10.963 0 0 1-4.72-4.14c-.604-.806-1.04-1.79-1.04-2.82 0-1.098.57-1.694.773-1.913.204-.219.538-.288.757-.288.22 0 .438.005.626.012.197.007.457-.075.713.543.264.636.903 2.195.98 2.35.078.156.13.338.026.547-.104.21-.157.339-.313.522-.157.18-.328.403-.47.54-.156.15-.32.313-.138.625.181.312.806 1.326 1.727 2.148.19.17.359.34.542.474.183.136.326.173.542.02.215-.152.926-.926 1.173-1.246.248-.32.496-.264.82-.143.326.12 2.068 1.026 2.427 1.206.36.18.6.269.69.421.09.15.09.87-.146 1.533z" />
              </svg>
              <strong style={{ fontSize: '19px', color: '#0d2e1a', fontWeight: 800 }}>Let's Work Together</strong>
            </div>
            
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Partner with us for reliable supply of premium Nigerian agricultural products. We handle all logistics, phytosanitary checks, and customs clearing documentation.
            </p>

            <Link to="/contact" style={{
              background: '#0d2e1a',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'background-color 0.2s',
              display: 'block'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#123c24'}
               onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d2e1a'}>
              Get in Touch <span>→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ─── HOVER STYLES & INTERACTION ─── */}
      <style>{`
        .product-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(18,60,36,0.06) !important;
          border-color: var(--brand-primary) !important;
        }
        .product-card-hover:hover .card-btn-hover {
          background-color: var(--brand-hover) !important;
        }
        .card-link-hover:hover {
          text-decoration: underline !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 1200px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
          }
          .stats-grid-new {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
          }
          .stats-item-new {
            border-right: none !important;
            padding-right: 0 !important;
          }
        }
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-title {
            font-size: 38px !important;
            line-height: 1.2 !important;
          }
          .hero-title span {
            font-size: 32px !important;
          }
          .products-section-title {
            font-size: 28px !important;
          }
          .hero-left-col {
            padding: 80px 24px 60px !important;
            align-items: center !important;
          }
          .hero-left-col p {
            margin: 0 auto !important;
          }
          .hero-actions {
            justify-content: center;
          }
          .hero-image-col {
            justify-content: center !important;
            padding: 0 24px 60px !important;
          }
          .hero-image-col img {
            max-width: 90% !important;
            margin: 0 auto !important;
          }
          .cta-wrapper {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .stats-grid-new {
            grid-template-columns: 1fr 1fr !important;
          }
          .about-circle-container {
            width: 160px !important;
            height: 160px !important;
          }
          .hero-title {
            font-size: 30px !important;
          }
          .hero-title span {
            font-size: 26px !important;
          }
          .products-section-title {
            font-size: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .stats-grid-new {
            grid-template-columns: 1fr !important;
          }
          .cta-card-new {
            padding: 24px !important;
          }
          .hero-title {
            font-size: 26px !important;
          }
          .hero-title span {
            font-size: 22px !important;
          }
          .products-section-title {
            font-size: 21px !important;
          }
        }
      `}</style>

    </div>
  )
}