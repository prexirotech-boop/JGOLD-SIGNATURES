import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getShortDesc } from './ProductsPage'

const SLIDES = [
  '/slideshow_1.png',
  '/slideshow_2.png',
  '/slideshow_3.png'
]

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeFaq, setActiveFaq] = useState(null)

  // Slideshow interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // Load featured products from Supabase
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: true })
        .limit(4) // Load up to 4 items for a full layout
      
      if (!error && data) {
        setFeaturedProducts(data)
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  return (
    <div className="home-layout">
      
      {/* Hero Section with Dynamic Fading Slideshow */}
      <section className="home-hero">
        <div className="hero-slideshow-container">
          {SLIDES.map((slide, idx) => (
            <div 
              key={slide} 
              className={`hero-slide ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
          <div className="hero-overlay" />
        </div>

        <div className="home-container hero-content animate-fade-in">
          <span className="hero-badge-glow">
            <span className="badge-dot" /> ELITE DIGITAL ACADEMY & MENTORSHIP
          </span>

          <h1 className="hero-title">
            Build High-Income Skills. Earn Daily. <span className="gradient-text">Build Real Wealth.</span>
          </h1>

          <p className="hero-subtitle">
            Skip theoretical academic models. We provide practical, step-by-step blueprints and elite training programs designed for the modern digital economy.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn-hero-primary">
              Explore Our Blueprints <span className="arrow">→</span>
            </Link>
            <Link to="/about" className="btn-hero-outline">
              Our Story
            </Link>
          </div>

          <div className="hero-trust-indicator">
            <div className="stars">★★★★★</div>
            <p>Rated <strong>4.9/5</strong> by 2,500+ successful graduates globally</p>
          </div>
        </div>
      </section>

      {/* Brand Stat Section */}
      <section className="stats-strip">
        <div className="home-container">
          <div className="stats-grid">
            {[
              { val: '2,500+', label: 'Graduated Students' },
              { val: '18+', label: 'Premium Blueprints' },
              { val: '4.9/5', label: 'Average Course Rating' },
              { val: '100%', label: 'Practical Focus (Zero Fluff)' }
            ].map((item, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value">{item.val}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Grid Section - TAKEN UP ON THE PAGE */}
      <section className="home-section bg-off-white">
        <div className="home-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">ACADEMY</span>
            <h2>Premium Mentoring & Blueprints</h2>
            <p>Gain instant access to our highly sought-after execution systems.</p>
          </div>

          <div className="home-grid">
            {loading ? (
              // Skeleton loading states
              [1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton-image" />
                  <div className="skeleton-body">
                    <div className="skeleton-line title" />
                    <div className="skeleton-line text" />
                    <div className="skeleton-line text" />
                    <div className="skeleton-line tags" />
                  </div>
                  <div className="skeleton-footer" />
                </div>
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="empty-products">
                No blueprints are currently published. Check back soon!
              </div>
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
                    className="premium-product-card"
                  >
                    {/* Card Cover Image */}
                    <div className="product-image-area">
                      {product.cover_image ? (
                        <img 
                          src={product.cover_image} 
                          alt={product.title.replace(/\s+slug$/i, '')} 
                          className="hover-zoom" 
                        />
                      ) : (
                        <div className="default-type-icon">
                          {isCourse ? '🎓' : '📗'}
                        </div>
                      )}
                      
                      {/* Badge Overlays */}
                      <div className="card-overlays">
                        {isCourse && <span className="type-badge course">COURSE</span>}
                        {!isCourse && <span className="type-badge ebook">E-BOOK</span>}
                        {discountPct && <span className="type-badge discount">{discountPct}% OFF</span>}
                      </div>
                    </div>

                    <div className="product-details-area">
                      <h3>{product.title.replace(/\s+slug$/i, '')}</h3>
                      <p className="description-preview">
                        {product.short_description || getShortDesc(product)}
                      </p>
                      
                      {features.length > 0 && (
                        <div className="features-tags-strip">
                          {features.slice(0, 3).map((feat, idx) => (
                            <span key={idx} className="feat-tag">{feat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="product-footer-area">
                      <div className="price-box">
                        {product.old_price && <span className="old-price">₦{product.old_price.toLocaleString()}</span>}
                        <span className="price-tag">₦{product.price.toLocaleString()}</span>
                      </div>
                      <span className="premium-card-btn">
                        {isCourse ? 'Enroll Now' : 'Get E-Book'} →
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Curricular Pillars - MOVED BELOW PRODUCTS */}
      <section className="home-section bg-surface">
        <div className="home-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">CURRICULUM</span>
            <h2>Our Core Skill Pillars</h2>
            <p>Four specialized domains built for maximum leverage and daily income.</p>
          </div>

          <div className="pillars-grid">
            {/* Pillar 1 */}
            <div className="pillar-card">
              <div className="pillar-icon-box orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pillar-svg">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                </svg>
              </div>
              <h3>Software & AI Engineering</h3>
              <p>Master modern web stacks and build custom AI-powered integrations to automate business pipelines.</p>
              <ul className="pillar-list">
                <li>✓ Fullstack Web Apps (React, Vite, Node)</li>
                <li>✓ Serverless Backend & Database Architectures</li>
                <li>✓ Autonomous AI Agents & API Integrations</li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card">
              <div className="pillar-icon-box green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pillar-svg">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>High-Ticket Freelancing</h3>
              <p>Learn how to package your services and sign high-paying global clients who pay in stable currencies.</p>
              <ul className="pillar-list">
                <li>✓ Global Client Acquisition & Lead Generation</li>
                <li>✓ Premium Freelance Profile Funnels</li>
                <li>✓ Strategic Cold Pitching & Closing scripts</li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card">
              <div className="pillar-icon-box blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pillar-svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3>E-Book Mastery</h3>
              <p>Self-publish guides and digital assets that address critical market needs and run on complete autopilot.</p>
              <ul className="pillar-list">
                <li>✓ Researching Lucrative Niche Demands</li>
                <li>✓ High-Conversion Landing Pages</li>
                <li>✓ Social Media Lead Magnets</li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="pillar-card">
              <div className="pillar-icon-box gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pillar-svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <h3>Digital Marketing</h3>
              <p>Drive highly-targeted traffic that converts and scale advertising campaigns with maximum ROI.</p>
              <ul className="pillar-list">
                <li>✓ Direct Response Copywriting</li>
                <li>✓ Paid Advertising Campaigns (Meta, Google)</li>
                <li>✓ Funnel Optimization & Analytics tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Spotlight Section */}
      <section className="home-section bg-gradient-dark text-light">
        <div className="home-container">
          <div className="founder-wrapper">
            <div className="founder-text-column">
              <span className="section-tag border-light">OUR MISSION</span>
              <h2>We Build Builders, Not Theorists</h2>
              <p className="founder-p">
                Most educational systems are designed around outdated curricula that prioritize memorization over production. At Amplified Skills, we reject theoretical learning.
              </p>
              <p className="founder-p">
                Every single course, blueprint, and playbook we publish is built upon actual battle-tested experience. We teach you exactly what is making money today in the global digital economy.
              </p>
              
              <div className="founder-pillars-mini">
                <div className="mini-item">
                  <div className="mini-check">✓</div>
                  <div>
                    <strong>Direct Mentorship</strong>
                    <span>Get answers directly from executors who actively run digital operations.</span>
                  </div>
                </div>
                <div className="mini-item">
                  <div className="mini-check">✓</div>
                  <div>
                    <strong>USD & Global Scale</strong>
                    <span>Our blueprints focus on teaching local builders how to acquire international clients.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="founder-card-column">
              <div className="founder-glass-card">
                <div className="quote-icon">“</div>
                <blockquote>
                  We don't teach. We guide. Every blueprint is a battle-tested roadmap that we have used ourselves to build high-scale digital operations. If it doesn't generate income, it's not on our platform.
                </blockquote>
                <div className="founder-profile">
                  <img src="/favicon.png" alt="Amplified Team" className="founder-team-logo" />
                  <div className="founder-meta">
                    <cite className="founder-name">The Amplified Team</cite>
                    <span className="founder-title">Elite Mentoring & Playbooks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Testimonials / Outcomes */}
      <section className="home-section bg-light-gray">
        <div className="home-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">TESTIMONIALS</span>
            <h2>Real Success, Real Numbers</h2>
            <p>Hear from active students who executed the blueprints and unlocked cash flow.</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="t-rating">★★★★★</div>
              <p className="t-text">
                "I was highly skeptical at first, but the E-book blueprint changed everything. Within 2 months, I researched a niche, designed a landing page, and generated over ₦250,000 in direct sales. The execution model is incredibly simple."
              </p>
              <div className="t-user">
                <img src="/testimonial_2.png" alt="Amina Y." className="t-user-image" />
                <div>
                  <strong>Amina Y.</strong>
                  <span>E-Book Mastery Student</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="t-rating">★★★★★</div>
              <p className="t-text">
                "The software & AI engineering blueprint gave me the exact tools to build a custom automation agency. Instead of coding boilerplate sites, I learned how to connect APIs and build systems. I've already signed two US-based clients."
              </p>
              <div className="t-user">
                <img src="/testimonial_1.png" alt="Chidi O." className="t-user-image" />
                <div>
                  <strong>Chidi O.</strong>
                  <span>Software & AI Engineering Student</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="t-rating">★★★★★</div>
              <p className="t-text">
                "High-Ticket Freelancing showed me how to pitch my services in USD. Using their profile templates and client acquisition templates, I closed my first contract on Upwork for $800 in less than 21 days."
              </p>
              <div className="t-user">
                <img src="/testimonial_3.png" alt="Precious E." className="t-user-image" />
                <div>
                  <strong>Precious E.</strong>
                  <span>High-Ticket Freelancing Student</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Accordion FAQs summary */}
      <section className="home-section bg-surface">
        <div className="home-container">
          <div className="section-header animate-slide-up">
            <span className="section-tag">FAQ</span>
            <h2>Got Questions? We Have Answers</h2>
            <p>Clear, direct responses to help you decide on your next blueprint.</p>
          </div>

          <div className="faq-accordion-box">
            {[
              {
                q: "Are these programs suitable for complete beginners?",
                a: "Absolutely. Each blueprint begins with basic concepts and builds up. We design our training with direct, actionable playbooks so you won't get lost in complex theoretical jargon."
              },
              {
                q: "Do I need a laptop, or can I use my phone?",
                a: "You can start learning on either! While writing software is much easier on a PC, several of our blueprints (like E-Book Mastery and High-Ticket Freelancing) have students earning using just their phones or PC."
              },
              {
                q: "How long do I have access to the blueprints?",
                a: "Once you purchase a blueprint, you have lifetime access. This includes all future course updates, playbooks, community threads, and live session recordings."
              },
              {
                q: "Is there support if I get stuck?",
                a: "Yes. Every student gains access to our community forums where you can ask questions, share your milestone screenshots, and get support from mentors and other students."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div key={idx} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                  <button className="faq-accordion-header" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div className="faq-accordion-content" style={{ maxHeight: isOpen ? '200px' : '0' }}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="faq-cta-footer">
            <p>Have more questions?</p>
            <Link to="/faq" className="btn-outline font-sm">
              View Full FAQ Page
            </Link>
          </div>
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="final-cta-section">
        <div className="home-container">
          <div className="final-cta-card">
            <h2>Ready to Amplify Your Skills?</h2>
            <p>Gain instant access to our premium blueprints, dedicated mentoring, and start earning today.</p>
            <div className="final-cta-actions">
              <Link to="/products" className="btn-hero-primary glow">
                Explore Programs Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Premium Stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        .home-layout {
          min-height: 100vh;
          font-family: var(--font);
          background: #ffffff;
          overflow-x: hidden;
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ─── BACKGROUND SLIDESHOW ─── */
        .home-hero {
          position: relative;
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 0;
          text-align: center;
          overflow: hidden;
          color: white;
        }

        .hero-slideshow-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
          transform: scale(1.05);
          animation: zoomSlow 30s infinite alternate;
        }

        .hero-slide.active {
          opacity: 0.38;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #050b14 0%, #0c152d 100%);
          z-index: 2;
          opacity: 0.9;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          max-width: 820px;
        }

        /* Animations */
        @keyframes zoomSlow {
          0% { transform: scale(1.02); }
          100% { transform: scale(1.09); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-up {
          opacity: 1;
        }

        /* Hero Text & Badges */
        .hero-badge-glow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(37, 99, 235, 0.35);
          color: #93c5fd;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 28px;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.1);
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 8px #3b82f6;
          display: inline-block;
          animation: pulseGlow 2s infinite;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }

        .hero-title {
          font-family: var(--font-heading) !important;
          font-size: clamp(2.6rem, 6.5vw, 4.4rem) !important;
          font-weight: 900 !important;
          line-height: 1.15;
          letter-spacing: -2px;
          margin-bottom: 24px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 19px;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 680px;
          margin: 0 auto 40px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 40px;
        }

        /* Hero Action Buttons */
        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 50px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
        }

        .btn-hero-primary:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.45);
        }

        .btn-hero-primary:hover .arrow {
          transform: translateX(4px);
        }

        .btn-hero-primary .arrow {
          transition: transform 0.2s ease;
        }

        .btn-hero-outline {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: 600;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 50px;
          transition: all 0.3s ease;
        }

        .btn-hero-outline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .hero-trust-indicator {
          font-size: 14px;
          color: #94a3b8;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 24px;
          display: inline-block;
        }

        .hero-trust-indicator .stars {
          color: #f59e0b;
          font-size: 18px;
          margin-bottom: 6px;
          letter-spacing: 2px;
        }

        /* ─── STATS STRIP ─── */
        .stats-strip {
          background: #0b1329;
          border-top: 1px solid #1e293b;
          border-bottom: 1px solid #1e293b;
          padding: 40px 0;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          text-align: center;
        }

        .stats-grid .stat-card {
          padding: 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-grid .stat-card:last-child {
          border-right: none;
        }

        .stat-value {
          font-family: var(--font-heading) !important;
          font-size: clamp(2rem, 4.5vw, 2.7rem);
          font-weight: 800;
          color: #3b82f6;
          margin-bottom: 6px;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ─── SECTIONS COMMON ─── */
        .home-section {
          padding: 96px 0;
        }

        .bg-gradient-light {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .bg-off-white {
          background: #f9fafb;
        }

        .bg-light-gray {
          background: #f8fafc;
        }

        .bg-surface {
          background: #ffffff;
        }

        .section-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 64px;
        }

        .section-tag {
          display: inline-block;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 4px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-family: var(--font-heading) !important;
          font-size: 38px !important;
          font-weight: 800 !important;
          color: #0f172a;
          margin: 0 0 16px;
          letter-spacing: -1.2px;
        }

        .section-header p {
          font-size: 17.5px;
          color: #64748b;
          line-height: 1.6;
        }

        /* ─── PILLARS GRID ─── */
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .pillar-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pillar-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }

        .pillar-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .pillar-icon-box.orange { background: #fff7ed; color: #ea580c; }
        .pillar-icon-box.green { background: #f0fdf4; color: #16a34a; }
        .pillar-icon-box.blue { background: #eff6ff; color: #2563eb; }
        .pillar-icon-box.gold { background: #fffbeb; color: #d97706; }

        .pillar-svg {
          width: 26px;
          height: 26px;
        }

        .pillar-card h3 {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0f172a;
          margin: 0 0 12px;
        }

        .pillar-card p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .pillar-list {
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pillar-list li {
          font-size: 13.5px;
          color: #475569;
          font-weight: 500;
        }

        /* ─── PRODUCT BLUEPRINT GRID ─── */
        .home-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
        }

        .premium-product-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.015);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.08);
          border-color: #2563eb;
        }

        .premium-product-card:hover h3 {
          color: #2563eb;
        }

        .product-image-area {
          position: relative;
          height: 200px;
          background: linear-gradient(135deg, #1e3a8a, #0b1329);
          overflow: hidden;
        }

        .product-image-area img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .premium-product-card:hover .hover-zoom {
          transform: scale(1.06);
        }

        .default-type-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 64px;
        }

        .card-overlays {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          gap: 8px;
        }

        .type-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          color: white;
        }

        .type-badge.course { background: #2563eb; }
        .type-badge.ebook { background: #16a34a; }
        .type-badge.discount { background: #dc2626; }

        .product-details-area {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .product-details-area h3 {
          font-size: 21px !important;
          font-weight: 800 !important;
          color: #0f172a;
          margin: 0 0 12px;
          line-height: 1.35;
          transition: color 0.2s ease;
        }

        .description-preview {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 20px;
          flex: 1;
        }

        .features-tags-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .feat-tag {
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 50px;
        }

        .product-footer-area {
          padding: 20px 28px;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-box {
          display: flex;
          flex-direction: column;
        }

        .old-price {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: line-through;
          line-height: 1;
          margin-bottom: 2px;
        }

        .price-tag {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .premium-card-btn {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.28s ease;
          display: inline-block;
        }

        .premium-product-card:hover .premium-card-btn {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        /* Skeleton Loading Cards */
        .skeleton-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          height: 480px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .skeleton-image {
          height: 220px;
          background: #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .skeleton-body {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .skeleton-line.title {
          width: 70%;
          height: 24px;
          margin-bottom: 8px;
        }

        .skeleton-line.text {
          width: 100%;
          height: 16px;
        }

        .skeleton-line.tags {
          width: 50%;
          height: 14px;
          margin-top: auto;
        }

        .skeleton-footer {
          height: 70px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }

        .skeleton-image::after,
        .skeleton-line::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          transform: translateX(-100%);
          animation: loadingShimmer 1.5s infinite;
        }

        @keyframes loadingShimmer {
          100% { transform: translateX(100%); }
        }

        .empty-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 64px;
          color: #64748b;
          font-size: 16px;
        }

        /* ─── FOUNDER SPOTLIGHT ─── */
        .bg-gradient-dark {
          background: linear-gradient(135deg, #0b1329 0%, #050b14 100%);
          border-top: 1px solid #1e293b;
        }

        .text-light {
          color: white;
        }

        .founder-wrapper {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 64px;
          align-items: center;
        }

        .founder-text-column .section-tag.border-light {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #93c5fd;
        }

        .founder-text-column h2 {
          font-family: var(--font-heading) !important;
          font-size: 38px !important;
          font-weight: 800 !important;
          color: #ffffff;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .founder-p {
          font-size: 16.5px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .founder-pillars-mini {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mini-item {
          display: flex;
          gap: 16px;
        }

        .mini-check {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          background: rgba(37, 99, 235, 0.2);
          border: 1px solid rgba(37, 99, 235, 0.4);
          color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .mini-item strong {
          display: block;
          font-size: 15px;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .mini-item span {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .founder-glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .quote-icon {
          font-size: 96px;
          color: rgba(37, 99, 235, 0.15);
          font-family: serif;
          position: absolute;
          top: 10px;
          left: 24px;
          line-height: 1;
        }

        .founder-glass-card blockquote {
          font-size: 18.5px;
          color: #e2e8f0;
          font-style: italic;
          line-height: 1.6;
          position: relative;
          z-index: 2;
          margin-bottom: 32px;
        }

        .founder-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .founder-team-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
          background: #0f172a;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          padding: 6px;
        }

        .founder-meta {
          display: flex;
          flex-direction: column;
        }

        .founder-name {
          font-weight: 700;
          color: white;
          font-style: normal;
          font-size: 15px;
        }

        .founder-title {
          font-size: 13px;
          color: #64748b;
        }

        /* ─── TESTIMONIALS ─── */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .testimonial-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .t-rating {
          color: #f59e0b;
          font-size: 16px;
          margin-bottom: 16px;
        }

        .t-text {
          font-size: 14.5px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 24px;
          font-style: italic;
        }

        .t-user {
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .t-user-image {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #2563eb;
        }

        .t-user strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
        }

        .t-user span {
          font-size: 12.5px;
          color: #64748b;
        }

        /* ─── INTERACTIVE ACCORDION FAQS ─── */
        .faq-accordion-box {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-accordion-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .faq-accordion-item.open {
          border-color: #cbd5e1;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .faq-accordion-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          text-align: left;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          background: none;
          border: none;
          cursor: pointer;
        }

        .faq-toggle-icon {
          font-size: 20px;
          color: #64748b;
          font-weight: normal;
        }

        .faq-accordion-content {
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .faq-accordion-content p {
          padding: 0 24px 20px;
          font-size: 14.5px;
          color: #475569;
          line-height: 1.6;
        }

        .faq-cta-footer {
          text-align: center;
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .faq-cta-footer p {
          font-size: 15px;
          color: #64748b;
        }

        .font-sm {
          font-size: 13.5px;
          padding: 10px 20px;
        }

        /* ─── FINAL CTA BANNER ─── */
        .final-cta-section {
          padding: 0 0 96px 0;
        }

        .final-cta-card {
          background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
          border-radius: 24px;
          padding: 64px 32px;
          text-align: center;
          color: white;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }

        .final-cta-card h2 {
          font-family: var(--font-heading) !important;
          font-size: 36px !important;
          font-weight: 850 !important;
          color: #ffffff;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }

        .final-cta-card p {
          font-size: 17px;
          color: #94a3b8;
          max-width: 580px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .final-cta-actions {
          display: flex;
          justify-content: center;
        }

        .btn-hero-primary.glow {
          box-shadow: 0 0 30px rgba(37, 99, 235, 0.5);
        }

        .btn-hero-primary.glow:hover {
          box-shadow: 0 0 40px rgba(37, 99, 235, 0.7);
        }

        /* ─── RESPONSIVENESS ─── */
        @media (max-width: 992px) {
          .founder-wrapper {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        @media (max-width: 768px) {
          .home-hero {
            padding: 80px 0;
            min-height: auto;
          }

          .hero-title {
            font-size: 32px !important;
            line-height: 1.25 !important;
            letter-spacing: -1px !important;
          }

          .hero-title br {
            display: none;
          }

          .hero-subtitle {
            font-size: 16px !important;
            line-height: 1.5 !important;
            margin-bottom: 32px;
          }

          .hero-actions {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }

          .btn-hero-primary, .btn-hero-outline {
            width: auto !important;
            min-width: 240px;
            text-align: center;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .stats-grid .stat-card {
            border-right: none;
            padding: 8px;
          }

          .stats-grid .stat-card:nth-child(odd) {
            border-right: 1px solid rgba(255, 255, 255, 0.1);
          }

          .home-section {
            padding: 64px 0;
          }

          .section-header h2 {
            font-size: 30px !important;
          }

          .founder-text-column h2 {
            font-size: 30px !important;
          }

          .founder-glass-card {
            padding: 32px;
          }

          .final-cta-card h2 {
            font-size: 28px !important;
          }
        }
      `}} />
    </div>
  )
}
