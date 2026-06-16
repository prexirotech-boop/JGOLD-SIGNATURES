import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Student purchase notification data
const PURCHASE_NOTIFICATIONS = [
  { name: 'Kelechi from Enugu', course: 'Freelance Web Design Blueprint Masterclass', time: '2m ago' },
  { name: 'Yusuf from Kaduna', course: 'Freelance Web Design Blueprint Masterclass', time: '5m ago' },
  { name: 'Chioma from Lagos', course: 'Freelance Web Design Blueprint Masterclass', time: '1m ago' },
  { name: 'Blessing from Port Harcourt', course: 'Freelance Web Design Blueprint Masterclass', time: '8m ago' },
  { name: 'Abubakar from Abuja', course: 'Freelance Web Design Blueprint Masterclass', time: '4m ago' },
  { name: 'Olumide from Ibadan', course: 'Freelance Web Design Blueprint Masterclass', time: '3m ago' }
]

// Professional website briefs from the client
const PROJECT_BRIEFS = [
  {
    title: '💼 Pinnacle Advisory & Co. (Accounting Firm Website)',
    description: 'A website brief for a professional chartered accounting & business advisory firm in Lagos, Nigeria.',
    text: `Client Name: Pinnacle Advisory & Co.
Location: Victoria Island, Lagos, Nigeria
Project Type: Professional Services Website Design & Development

ABOUT THE CLIENT
Pinnacle Advisory & Co. is a Lagos-based chartered accounting and business advisory firm established in 2009. The firm provides audit, tax, financial advisory, and business consulting services to SMEs, mid-market companies, and high-net-worth individuals across Nigeria.

PROJECT OBJECTIVE
Design and develop a polished, authoritative website that establishes Pinnacle Advisory & Co. as a first-choice firm for businesses seeking credible financial and advisory services in Nigeria. The site must generate qualified consultation enquiries and build B2B trust.

PAGES REQUIRED
1. Home — Authoritative headline, services overview, stats, testimonials, consultation CTA
2. About Us — History, mission, credentials, ICAN/ACCA professional affiliations
3. Our Team — Partner and senior staff profiles with credentials and LinkedIn links
4. Services — Dedicated sub-pages: Audit, Tax compliance, Business Advisory & Strategy
5. Industries We Serve — Fintech, Real Estate, FMCG, Oil & Gas, Healthcare, NGOs
6. Insights / Resources — CMS blog for tax updates, sitemap, gated downloads
7. Client Portal Link — CTA to secure document-sharing platform
8. Contact & Consultation — Office address (VI, Lagos), map, consultation form

DESIGN DIRECTION
- Tone: Authoritative, precise, quietly confident.
- Colour Palette: Deep navy + warm gold accent + white.
- Typography: Classic serif headlines + clean modern sans-serif body text.
- Imagery: Professional team photos, Lagos business skyline — no generic stock images.

BUDGET RANGE
₦1,000,000 – ₦1,800,000 depending on final scope.`
  },
  {
    title: '🌱 Arise Africa Foundation (NGO Website Brief)',
    description: 'A compelling website brief for a youth empowerment, education access, and community development NGO.',
    text: `Client Name: Arise Africa Foundation
Location: Lagos, Nigeria
Project Type: NGO / Non-Profit Website Design & Development

ABOUT THE CLIENT
Arise Africa Foundation is a Lagos-based NGO focused on youth empowerment, education access, and community development across underserved communities in Nigeria. Founded in 2014, they run skills training programmes, scholarship initiatives, and health outreach across Lagos, Kano, and Enugu states.

PROJECT OBJECTIVE
Design and develop a compelling, credible website that communicates the Foundation's impact, attracts donors and volunteers, and serves as the central hub for programme information, stories, and funding appeals.

PAGES REQUIRED
1. Home — Mission, impact stats (beneficiaries reached, communities served), latest stories, donation CTA
2. About Us — Foundation story, board of trustees, team, NGO registration certifications
3. Our Programmes — Youth Skills, Scholarship Fund, Health Outreach, Community Development
4. Impact & Reports — Annual PDF reports download, impact data visualisations, testimonials
5. Stories / Blog — Field stories, beneficiary spotlights, news and press releases
6. Get Involved — Volunteer sign-up form, partnership enquiry, CSR collaboration
7. Donate — Paystack (Nigerian) and Stripe (international) payment integrations, transparent fund allocation
8. Contact — Office address, phone, email, contact form, social media links

DESIGN DIRECTION
- Tone: Warm, hopeful, credible — not desperate or charity-cliché.
- Colour Palette: Deep forest green + warm gold accent + clean white.
- Typography: Humanist sans-serif for warmth and readability.
- Imagery: Authentic, high-quality photos of real beneficiaries and field activities.

BUDGET RANGE
₦1,200,000 – ₦2,200,000 depending on final scope.`
  }
]

export default function WebinarPage() {
  const navigate = useNavigate()
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [salesActive, setSalesActive] = useState(false)
  const [currentSale, setCurrentSale] = useState(null)
  const [showSale, setShowSale] = useState(false)
  const [evergreenDate, setEvergreenDate] = useState('')

  // Load Wistia scripts for sbeep923r7
  useEffect(() => {
    const script1 = document.createElement('script')
    script1.src = 'https://fast.wistia.com/player.js'
    script1.async = true
    document.body.appendChild(script1)

    const script2 = document.createElement('script')
    script2.src = 'https://fast.wistia.com/embed/sbeep923r7.js'
    script2.async = true
    script2.type = 'module'
    document.body.appendChild(script2)
  }, [])

  // Calculate evergreen date: 4 days from today
  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 4)
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    setEvergreenDate(date.toLocaleDateString('en-US', options))
  }, [])



  // Activate sales notifications after 10 minutes (600,000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSalesActive(true)
    }, 10 * 60 * 1000)

    return () => clearTimeout(timer)
  }, [])

  // Handle sales notification popup rotation
  useEffect(() => {
    if (!salesActive) return

    const triggerNotification = () => {
      const sale = PURCHASE_NOTIFICATIONS[Math.floor(Math.random() * PURCHASE_NOTIFICATIONS.length)]
      setCurrentSale(sale)
      setShowSale(true)
      setTimeout(() => setShowSale(false), 5000)
    }

    triggerNotification()
    const interval = setInterval(triggerNotification, 18000)

    return () => clearInterval(interval)
  }, [salesActive])

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  const handleCTA = () => {
    navigate('/checkout?product=freelance-web-design-blueprint')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="wb-root">
      
      {/* Top Warning Banner */}
      <div className="wb-warning-banner">
        <span><strong>PLEASE BLOCK OFF DISTRACTIONS:</strong> You are about to discover a life-changing AI blueprint. Sit in a quiet place, grab a pen, and implement everything you learn. This video will not remain online forever!</span>
      </div>

      <div className="wb-container">
        
        {/* Rebuilt Header Hook */}
        <div className="wb-header text-center">
          <span className="wb-badge">FREE TRAINING PLAYBACK</span>
          <h1 className="wb-title">
            The AI Website Builder Replay
          </h1>
          <p className="wb-subtitle">
            Watch the training below to learn how you can build premium websites in under 10 minutes using free tools and no coding.
          </p>
        </div>

        {/* Video Player Card */}
        <div className="wb-video-card">
          <div className="wb-video-wrapper" style={{ borderRadius: '10px', overflow: 'hidden', background: '#000', maxWidth: '810px', margin: '0 auto' }}>
            <wistia-player 
              media-id="sbeep923r7" 
              aspect="0.5625" 
              style={{ width: '100%', height: '100%', display: 'block' }}
            ></wistia-player>
          </div>
          <p className="wb-video-caption">Ensure your audio is turned ON. Do not refresh this page.</p>
        </div>

        {/* Direct Checkout Call to Action & FOMO Section */}
        <div className="wb-cta-section text-center">
          <button onClick={handleCTA} className="wb-cta-btn" style={{ marginBottom: '32px' }}>
            Claim Your Spot Now!
            <span className="btn-subtext">Click here to secure lifetime access</span>
          </button>
          
          <div className="wb-fomo-panel">
            <div className="fomo-header">FAST ACTION TAKERS DISCOUNT</div>
            <div className="fomo-price-comparison">
              <div className="price-box old">
                <span className="price-label">REGULAR PRICE</span>
                <span className="price-val">₦60,000</span>
              </div>
              <div className="price-box current">
                <span className="price-label">SPECIAL OFFER</span>
                <span className="price-val">₦35,000</span>
                <span className="price-status-tag active-tag">42% OFF</span>
              </div>
              <div className="price-box savings">
                <span className="price-label">YOU SAVE</span>
                <span className="price-val" style={{ color: '#10b981' }}>₦25,000</span>
              </div>
            </div>

            <div className="fomo-spots-alert">
              ⚡ <strong>WARNING:</strong> Only <strong>4 spots remaining</strong> at this price. Price increases to ₦60,000 automatically once these spots are gone.
            </div>

            <div className="fomo-progress-wrapper">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: '73%' }}>
                  <span className="progress-bar-percentage">11 of 15 spots taken (73%)</span>
                </div>
              </div>
              <p className="progress-bar-caption">
                Lock discount now. Remaining spots closing fast. Price rises to <strong>₦60,000</strong> on {evergreenDate}.
              </p>
            </div>
          </div>
          
          <div className="wb-cta-benefits">
            <h4 className="highlight-title">Here is what you get in the Freelance Web Design Blueprint Course:</h4>
            <div className="benefits-grid">
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>In-depth training on building professional, world-class websites for any type of business</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to attract high-paying clients daily — on social media, WhatsApp, LinkedIn, and referrals — without spending money on ads</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to close clients on the phone, on WhatsApp, or in person — with confidence and without feeling salesy</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to price your services correctly so you never undercharge again — and what to charge for websites in Nigeria vs. international clients</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to get paid upfront, manage client expectations, and deliver projects like a complete professional</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to set up recurring revenue — charging clients a monthly fee to maintain and manage their websites every year</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>Real projects you will build inside the course to strengthen your portfolio from day one</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>How to register your freelance business, set up your payment accounts (including Dollar accounts), and get paid from any country in the world</p>
              </div>
              <div className="benefit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p>Lifetime access to all course materials — including all future updates at no extra cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Briefs - Click to Copy Section */}
        <div className="wb-briefs-section">
          <h2 className="section-title text-center">Copy Your Practice Website Briefs Here</h2>
          <p className="section-subtitle text-center">
            As explained in the training video, here are the website project briefs. Click on either card below to instantly copy the brief requirements to your clipboard so you can practice building them!
          </p>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ai-studio-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14.5px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '0.3px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
                <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
              </svg>
              <span>Open Google AI Studio</span>
            </a>
          </div>

          <div className="wb-briefs-grid">
            {PROJECT_BRIEFS.map((brief, idx) => (
              <div 
                key={idx} 
                className="wb-brief-card" 
                onClick={() => handleCopyText(brief.text, idx)}
              >
                <div className="brief-card-header">
                  <h4>{brief.title}</h4>
                  <span className="copy-indicator">
                    {copiedIndex === idx ? 'COPIED!' : 'CLICK TO COPY'}
                  </span>
                </div>
                <p className="brief-desc">{brief.description}</p>
                <pre className="brief-pre">{brief.text}</pre>
                {copiedIndex === idx && <div className="copied-overlay">Copied to Clipboard!</div>}
              </div>
            ))}
          </div>
        </div>
      </div> {/* Close wb-container */}

      {/* SECTION 11 — FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p>© 2026 Amplified Skills | All Rights Reserved</p>
          <p className="lp-footer-disclaimer">
            This site is not affiliated with Facebook, Google, or Meta in any way. Results mentioned on this page are not typical and individual results will vary. This training is 100% free. No hidden fees or charges.
          </p>
          <div className="lp-footer-links">
            <a href="/privacy" className="lp-footer-link">Privacy Policy</a>
            <span className="lp-footer-divider">|</span>
            <a href="/terms" className="lp-footer-link">Terms of Service</a>
            <span className="lp-footer-divider">|</span>
            <a href="/contact" className="lp-footer-link">Contact Us</a>
          </div>
        </div>
      </footer>

      {/* Redesigned clean, emoji-less sales notifications in brand colors */}
      {showSale && currentSale && (
        <div className="wb-sales-toast">
          <div className="toast-border-accent"></div>
          <img 
            src="https://zisbhfwxaiqtxtkecyow.supabase.co/storage/v1/object/public/course-assets/course-covers/x1mdbk6f6db_1781534283461.jpg" 
            alt="Freelance Web Design Blueprint Course" 
            className="toast-course-image"
          />
          <div className="toast-content">
            <p className="toast-title">VERIFIED PAYMENT</p>
            <p className="toast-body">
              <strong>{currentSale.name.split(' secured ')[0].split(' just ')[0]}</strong> just purchased <strong>Freelance Web Design Blueprint</strong>!
            </p>
          </div>
        </div>
      )}

      {/* Inline styles */}
      <style>{`
        .wb-root {
          font-family: var(--font);
          background: linear-gradient(135deg, #0A0F2C 0%, #151C47 100%);
          min-height: 100vh;
          color: #ffffff;
          padding-bottom: 0px;
        }

        /* WARNING BANNER */
        .wb-warning-banner {
          background: #dc2626;
          color: #ffffff;
          padding: 14px 20px;
          text-align: center;
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.45;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);
        }
        wistia-player {
          display: block;
          width: 100%;
          height: 100%;
        }
        wistia-player[media-id='sbeep923r7']:not(:defined) {
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/sbeep923r7/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 177.78%;
        }

        .wb-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .text-center { text-align: center; }

        /* HEADER */
        .wb-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 1.5px;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 4px 12px;
          border-radius: 30px;
          margin-bottom: 16px;
        }
        .wb-title {
          font-family: 'Asimov', var(--font-heading), sans-serif !important;
          font-size: clamp(1.8rem, 4.5vw, 2.8rem);
          font-weight: 900;
          color: #ffffff;
          line-height: 1.25;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }
        .wb-subtitle {
          font-size: 16px;
          color: rgba(255,255,255,0.75);
          max-width: 760px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        /* VIDEO */
        .wb-video-card {
          max-width: 480px;
          margin: 0 auto 48px;
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .wb-video-wrapper {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 9/16;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        /* FOOTER */
        .lp-footer {
          background-color: #0A0F2C;
          color: #9CA3AF;
          padding: 48px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          margin: 0;
        }
        .toast-course-image {
          width: 45px;
          height: 45px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
          align-self: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .lp-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .lp-footer-disclaimer {
          font-size: 11px;
          line-height: 1.6;
          color: #6B7280;
        }
        .lp-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 12px;
          margin-top: 8px;
        }
        .lp-footer-link {
          color: #9CA3AF;
          transition: color 0.2s ease;
        }
        .lp-footer-link:hover {
          color: #f59e0b;
        }
        .lp-footer-divider {
          color: #374151;
        }
        .wb-video-caption {
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 14px;
          font-weight: 600;
        }

        /* CTA SECTION */
        .wb-cta-section {
          max-width: 800px;
          margin: 0 auto 60px;
        }

        /* FOMO CONVERSION PANEL */
        .wb-fomo-panel {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 32px;
          text-align: left;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .fomo-header {
          font-size: 11px;
          font-weight: 900;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 12px;
        }
        .fomo-price-comparison {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .price-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .price-box.old .price-val {
          color: rgba(255,255,255,0.4);
          text-decoration: line-through;
        }
        .price-box.current {
          background: rgba(245, 158, 11, 0.04);
          border-color: rgba(245, 158, 11, 0.35);
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.05);
        }
        .price-box.current .price-val {
          color: var(--gold);
          font-weight: 900;
          font-size: 1.6rem;
        }
        .price-label {
          font-size: 10px;
          font-weight: 800;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.3px;
        }
        .price-val {
          font-size: 1.35rem;
          font-weight: 800;
        }
        .price-status-tag {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          color: rgba(255,255,255,0.6);
        }
        .price-status-tag.active-tag {
          background: var(--gold);
          color: #050b14;
          font-weight: 900;
        }
        .fomo-spots-alert {
          background: rgba(220, 38, 38, 0.08);
          border: 1px dashed rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13.5px;
          color: #fca5a5;
          margin-bottom: 20px;
          text-align: center;
          line-height: 1.5;
        }
        .fomo-progress-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .progress-bar-container {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border-radius: 30px;
          height: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.04);
          position: relative;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #d97706, #f59e0b);
          border-radius: 30px;
          transition: width 0.5s ease-in-out;
        }
        .progress-bar-percentage {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 900;
          color: #ffffff;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .progress-bar-caption {
          font-size: 12.5px;
          color: rgba(255,255,255,0.6);
          margin: 0;
          line-height: 1.5;
          text-align: center;
        }

        .wb-cta-btn {
          padding: 20px 40px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 19px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          animation: pulseGlow 2s infinite;
        }
        .wb-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.6);
        }
        .btn-subtext {
          font-size: 11px;
          opacity: 0.85;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 35px rgba(245, 158, 11, 0.8); }
          100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
        }

        .wb-cta-benefits {
          background: rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 36px 30px;
          margin-top: 48px;
          text-align: left;
        }
        .highlight-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--gold);
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
        }
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .benefit-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .benefit-item .check {
          color: #10b981;
          font-weight: 900;
          font-size: 1.1rem;
        }
        .benefit-item p {
          font-size: 13.5px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        /* BRIEF SECTION */
        .wb-briefs-section {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 60px;
          margin-top: 20px;
        }
        .section-title {
          font-family: 'Asimov', var(--font-heading), sans-serif !important;
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .section-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          max-width: 720px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }
        .wb-briefs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .wb-brief-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1.5px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .wb-brief-card:hover {
          border-color: var(--gold);
          background: rgba(245, 158, 11, 0.03);
          transform: translateY(-2px);
        }
        .brief-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .brief-card-header h4 {
          font-family: 'Asimov', var(--font-heading), sans-serif !important;
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          line-height: 1.4;
          max-width: 70%;
        }
        .copy-indicator {
          font-size: 10px;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.5px;
        }
        .brief-desc {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .brief-pre {
          background: rgba(5, 11, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          font-family: monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
        }
        .copied-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(5, 11, 20, 0.9);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          color: #10b981;
          animation: fadeEffect 0.3s;
        }

        @keyframes fadeEffect {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* REDESIGNED VERIFIED SALES TOAST */
        .wb-sales-toast {
          position: fixed;
          bottom: 24px;
          left: 24px;
          background: #0b1329;
          border: 1px solid #1e3a8a;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: stretch;
          gap: 16px;
          z-index: 10000;
          max-width: 360px;
          backdrop-filter: blur(8px);
          animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .toast-border-accent {
          width: 4px;
          background: var(--gold);
          border-radius: 4px;
          flex-shrink: 0;
        }
        .toast-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .toast-title {
          margin: 0 !important;
          font-size: 10.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--gold) !important;
        }
        .toast-body {
          margin: 0 !important;
          font-size: 13px;
          color: #ffffff !important;
          font-weight: 500;
          line-height: 1.4;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-studio-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.45) !important;
        }

        /* RESPONSIVE */
        @media (max-width: 991px) {
          .benefits-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .wb-briefs-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .fomo-price-comparison {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px;
          }
          .wb-sales-toast {
            left: 16px;
            right: 16px;
            bottom: 16px;
            max-width: calc(100% - 32px);
          }
        }

        @media (max-width: 640px) {
          .wb-fomo-panel {
            padding: 16px 12px;
            margin-bottom: 24px;
          }
          .fomo-header {
            font-size: 10px;
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .fomo-price-comparison {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas: 
              "current current"
              "old future" !important;
            gap: 10px !important;
            margin-bottom: 16px;
          }
          .price-box.current {
            grid-area: current;
            padding: 14px 8px !important;
          }
          .price-box.old {
            grid-area: old;
            padding: 10px 4px !important;
          }
          .price-box.future {
            grid-area: future;
            padding: 10px 4px !important;
          }
          .price-label {
            font-size: 9px !important;
            text-align: center;
          }
          .price-val {
            font-size: 14px !important;
          }
          .price-box.current .price-val {
            font-size: 1.6rem !important;
          }
          .price-status-tag {
            font-size: 8px !important;
            padding: 2px 5px !important;
          }
          .fomo-spots-alert {
            font-size: 11.5px !important;
            padding: 10px 12px !important;
            margin-bottom: 16px !important;
          }
          .progress-bar-container {
            height: 28px !important;
          }
          .progress-bar-percentage {
            font-size: 11.5px !important;
          }
          .progress-bar-caption {
            font-size: 11.5px !important;
          }
        }
      `}</style>

    </div>
  )
}
