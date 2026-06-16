import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getShortDesc } from './ProductsPage'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      // For now, load up to 2 published products to feature
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: true }) // just grab the first two
        .limit(2)
      
      if (!error && data) {
        setFeaturedProducts(data)
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  return (
    <div className="home-layout">
      
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-container">
          <p className="hero-badge">
            Empowering the Next Generation of Digital Entrepreneurs
          </p>

          <h1>
            Build High-Income Skills.<br />
            <span className="text-primary">Earn Daily.</span> Build Real Wealth.
          </h1>

          <p className="hero-subtitle">
            Skip the theoretical academic models. We provide practical, step-by-step blueprints and elite training programs designed for the modern digital economy.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Explore Our Blueprints
            </Link>
            <Link to="/about" className="btn btn-outline btn-lg">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Grid Section */}
      <section className="home-section bg-surface">
        <div className="home-container">
          <div className="section-header">
            <h2>Premium Mentoring & Blueprints</h2>
            <p>Start today with our highly recommended training programs.</p>
          </div>

          <div className="home-grid">
            {loading ? (
              <div style={{ textAlign: 'center', width: '100%', padding: 40 }}>Loading featured programs...</div>
            ) : featuredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', width: '100%', padding: 40, color: '#64748b' }}>No programs currently available.</div>
            ) : (
              featuredProducts.map(product => {
                const isCourse = product.type === 'course'
                const features = product.features || []
                const discountPct = product.old_price && product.price
                  ? Math.round((1 - product.price / product.old_price) * 100)
                  : null

                return (
                  <Link 
                    to={`/product/${product.slug || product.id}`} 
                    key={product.id} 
                    className="product-card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {/* Card Cover Image */}
                    <div className="product-card-img-wrapper" style={{ position: 'relative', height: '200px', background: 'linear-gradient(135deg, #1e3a8a, #0b1329)', overflow: 'hidden' }}>
                      {product.cover_image ? (
                        <img src={product.cover_image} alt={product.title.replace(/\s+slug$/i, '')} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="card-hover-zoom" />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '56px' }}>
                          {isCourse ? '🎓' : '📗'}
                        </div>
                      )}
                      {/* Badges Overlay */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                        {isCourse && <span style={{ background: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>COURSE</span>}
                        {!isCourse && <span style={{ background: '#16a34a', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>E-BOOK</span>}
                        {discountPct && <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>{discountPct}% OFF</span>}
                      </div>
                    </div>

                    <div className="product-card-body" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', lineHeight: '1.4' }}>{product.title.replace(/\s+slug$/i, '')}</h3>
                      <p className="product-desc" style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px', flex: 1 }}>
                        {product.short_description || getShortDesc(product)}
                      </p>
                      
                      {features.length > 0 && (
                        <div className="product-tags" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          {features.slice(0, 2).map((feat, idx) => (
                            <span key={idx} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '50px', fontSize: '11.5px', fontWeight: '500' }}>{feat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="product-card-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {product.old_price && <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>₦{product.old_price.toLocaleString()}</span>}
                        <span className="product-price" style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>₦{product.price.toLocaleString()}</span>
                      </div>
                      <span className="btn btn-outline" style={{ pointerEvents: 'none', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}>
                        {isCourse ? 'Enroll Now' : 'Get E-Book'}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Brand Stat Section */}
      <section className="home-section bg-app">
        <div className="home-container">
          <div className="stats-grid">
            {[
              { val: '2,500+', label: 'Students Graduated' },
              { val: '₦120M+', label: 'Student Earnings combined' },
              { val: '4.9/5', label: 'Average Program Rating' }
            ].map((item, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value">{item.val}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="home-section">
        <div className="home-container">
          <div className="section-header">
            <h2>The Amplified Skills Difference</h2>
          </div>
          <div className="home-grid">
            {[
              { title: 'Zero Fluff, All Execution', desc: 'Every lesson, every video, and every module is engineered to give you the exact steps needed to execute and earn.' },
              { title: 'Local Context, Global Income', desc: 'Our blueprints are designed by entrepreneurs who understand the Nigerian market but teach you how to earn globally in USD.' },
              { title: 'Lifetime Support', desc: 'Enrollment means you join the community. We provide continuous updates, live Q&A sessions, and dedicated support.' }
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .home-layout {
          min-height: 100vh;
          font-family: var(--font);
          background: #f8fafc;
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .bg-surface { background: #ffffff; }
        .bg-app { background: #0f172a; color: white; }
        .text-primary { color: #2563eb; }

        /* Hero */
        .home-hero {
          padding: 100px 0;
          text-align: center;
          background: linear-gradient(to bottom, #ffffff, #f8fafc);
        }

        .hero-badge {
          display: inline-block;
          background: #e0e7ff;
          color: #4338ca;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
        }

        .home-hero h1 {
          font-size: 56px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 24px;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #475569;
          max-width: 680px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        /* Buttons */
        .btn {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
        }
        .btn-lg {
          padding: 16px 32px;
          font-size: 16px;
        }
        .btn-primary {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }
        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
        .btn-outline {
          background: transparent;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }
        .btn-outline:hover {
          background: #f1f5f9;
        }

        /* Sections */
        .home-section {
          padding: 80px 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .section-header h2 {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -1px;
        }
        .section-header p {
          font-size: 18px;
          color: #64748b;
        }

        .home-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
        }

        /* Product Cards */
        .product-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08);
        }
        .product-card:hover .card-hover-zoom {
          transform: scale(1.04);
        }

        /* Stats Section */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          text-align: center;
        }
        .stat-card {
          padding: 32px;
        }
        .stat-value {
          font-size: 48px;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }
        .stat-label {
          color: #94a3b8;
          font-size: 16px;
          font-weight: 500;
        }

        /* Features */
        .feature-card {
          background: #ffffff;
          padding: 32px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .feature-card h4 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
        }
        .feature-card p {
          color: #64748b;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .home-hero { padding: 60px 0; }
          .home-hero h1 { font-size: 40px; }
          .hero-actions { flex-direction: column; }
          .stats-grid { grid-template-columns: 1fr; gap: 0; }
          .product-card-footer { flex-direction: column; gap: 16px; align-items: stretch; text-align: center; }
        }
      `}} />
    </div>
  )
}
