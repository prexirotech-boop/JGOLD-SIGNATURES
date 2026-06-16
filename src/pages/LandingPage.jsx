import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// 15 Social proof notification popups (No emojis, clean text)
const SOCIAL_PROOF_NOTIFICATIONS = [
  { text: "Chidinma O. from Enugu just joined the free training", time: "2 minutes ago" },
  { text: "Emeka J. from Lagos just joined the free training", time: "5 minutes ago" },
  { text: "Fatima A. from Kano just joined the free training", time: "Just now" },
  { text: "Blessing T. from Port joined the free training", time: "1 minute ago" },
  { text: "Tunde M. from Ibadan just joined the free training", time: "3 minutes ago" },
  { text: "Yusuf A. from Kaduna just joined the free training", time: "4 minutes ago" },
  { text: "Ngozi E. from Owerri just joined the free training", time: "Just now" },
  { text: "Femi O. from Abeokuta just joined the free training", time: "6 minutes ago" },
  { text: "Halima S. from Jos just joined the free training", time: "2 minutes ago" },
  { text: "Tobi B. from Benin City just joined the free training", time: "1 minute ago" },
  { text: "Chioma D. from Asaba just joined the free training", time: "5 minutes ago" },
  { text: "Abubakar M. from Sokoto just joined the free training", time: "3 minutes ago" },
  { text: "Funmi K. from Akure just joined the free training", time: "Just now" },
  { text: "Kelechi U. from Umuahia just joined the free training", time: "8 minutes ago" },
  { text: "Abiodun S. from Ilorin just joined the free training", time: "2 minutes ago" }
]

// Testimonial Cards data with Unsplash portraits of black people, no ages, no states
const TESTIMONIALS = [
  {
    name: 'Adaeze Nwosu',
    avatar: '/avatars/adaeze.png',
    quote: 'I joined this training not knowing anything about websites. Honestly, I almost did not register because I thought it was going to be too technical. But in less than 10 minutes I had built my first website. I could not believe it. I have since made ₦180,000 from my first two clients.'
  },
  {
    name: 'Blessing Adeyemi',
    avatar: '/avatars/blessing.png',
    quote: 'I am a stay-at-home mum with three kids. I joined this training on my phone during my baby\'s nap time. Today I have four clients and I earn between $300–$500 every month working part time. This training literally changed my life.'
  },
  {
    name: 'Chukwuemeka Obi',
    avatar: '/avatars/obi.png',
    quote: 'I was a fresh graduate with no job and was very frustrated. A friend sent me this link and I registered thinking it was one of those useless things online. I was completely wrong. The training is real, it is practical, and I built two websites that same day. I now charge ₦120,000 per site.'
  },
  {
    name: 'Salisu Musa',
    avatar: '/avatars/salisu.png',
    quote: 'My brother, I am a bus driver. I did not even know what a website was properly before this training. Now I build websites for shop owners in my area and I have even gotten one client from the UK who pays me in pounds. This thing is real. Just take the training.'
  }
]

// 8 transaction screenshot proofs matching Image 2 exactly
const PROOF_IMAGES = [
  { src: '/proofs/1.jpg', alt: 'OPay Transaction Receipt N550,000' },
  { src: '/proofs/2.jpg', alt: 'OPay Transaction Receipt N400,000' },
  { src: '/proofs/3.jpg', alt: 'OPay Transaction Receipt N300,000' },
  { src: '/proofs/4.jpg', alt: 'OPay Transaction Receipt N250,000' },
  { src: '/proofs/5.jpg', alt: 'FCMB Receipt N340,000' },
  { src: '/proofs/6.jpg', alt: 'OPay Transaction Receipt N100,000' },
  { src: '/proofs/7.jpg', alt: 'Stanbic IBTC Online Transaction Receipt N100,000' },
  { src: '/proofs/8.jpg', alt: 'Bank Receipt N100,000' }
]

export default function LandingPage() {
  const navigate = useNavigate()
  
  // Shared form inputs between Section 3 and Section 9
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Social Proof Toast State
  const [activeNotifIdx, setActiveNotifIdx] = useState(0)
  const [showToast, setShowToast] = useState(false)

  // Intersection Observer for scroll fade-up animations
  const animatedElements = useRef([])

  // Auto-cycling social proof popup with non-distractive 25s intervals (5s show, 20s delay)
  useEffect(() => {
    const runCarousel = () => {
      setShowToast(true)
      const hideTimer = setTimeout(() => {
        setShowToast(false)
        setTimeout(() => {
          setActiveNotifIdx((prev) => (prev + 1) % SOCIAL_PROOF_NOTIFICATIONS.length)
        }, 500)
      }, 5000)

      return hideTimer
    }

    const startTimer = setTimeout(() => {
      let currentTimer = runCarousel()
      const interval = setInterval(() => {
        currentTimer = runCarousel()
      }, 25000)

      return () => {
        clearTimeout(currentTimer)
        clearInterval(interval)
      }
    }, 6000)

    return () => clearTimeout(startTimer)
  }, [])

  // Load Wistia scripts for n7ski2kp6w
  useEffect(() => {
    const script1 = document.createElement('script')
    script1.src = 'https://fast.wistia.com/player.js'
    script1.async = true
    document.body.appendChild(script1)

    const script2 = document.createElement('script')
    script2.src = 'https://fast.wistia.com/embed/n7ski2kp6w.js'
    script2.async = true
    script2.type = 'module'
    document.body.appendChild(script2)
  }, [])

  // Scroll animations setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        });
      },
      { threshold: 0.1 }
    )

    animatedElements.current.forEach((el) => {
      if (el) observer.observe(el)
    });

    return () => observer.disconnect()
  }, [])

  // Form submission logic mapping to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please fill out all fields.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('freelance_training_list')
        .insert({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: phone.trim(),
          source: 'freelance_blueprint_lp'
        })

      if (error) throw error

      setSubmitted(true)
      if (window.fbq) {
        window.fbq('track', 'Lead', { content_name: 'Freelance Web Design Free Training' })
      }
      setTimeout(() => {
        navigate('/webinar')
      }, 1000)
    } catch (err) {
      console.error('Lead collection error:', err)
      setErrorMsg('Unable to secure your spot. Please check your network and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentNotification = SOCIAL_PROOF_NOTIFICATIONS[activeNotifIdx]

  return (
    <div className="lp-container-root">
      {/* SECTION 1 — STICKY URGENCY BAR */}
      <div className="lp-urgency-bar">
        <div className="lp-urgency-inner">
          <span>WARNING: This Page Could Come Down At ANY Moment — Access The Free Training Before It's Gone Forever</span>
        </div>
      </div>

      {/* HERO WRAPPER (Includes Section 2 & Section 3 unified in dark gradient background) */}
      <div className="lp-hero-wrapper">
        
        {/* SECTION 2 — HERO HEADLINE AND SUBTEXT */}
        <section className="lp-hero-top">
          <div className="lp-hero-content">
            <div className="lp-badge">
              FREE TRAINING — LIMITED ACCESS
            </div>
            
            <h1 className="lp-hero-headline">
              Discover The Simple AI-Powered Skill Letting Ordinary Nigerians Earn In <span className="highlight-orange">Dollars, Pounds & Naira</span> — Building Websites For Business Owners Around The World From Their Bedrooms, Using Just Their Phones or PC… With <span className="highlight-underline">Zero Coding Skills</span>
            </h1>

            <p className="lp-hero-subheadline">
              In Less Than 10 Minutes Of Joining This FREE Training, You Will Build Your Very First Professional Website — Even If You Have Never Touched A Computer, Know Nothing About The Internet, Or Have Zero Tech Experience.
            </p>
          </div>
        </section>

        {/* SECTION 3 — TWO-COLUMN LAYOUT (Video Left + Form Right) */}
        <section className="lp-two-column-sec">
          <div className="lp-two-column-wrapper">
            
            {/* LEFT COLUMN: VIDEO PLAYER */}
            <div className="lp-video-col">
              <div className="lp-video-title">
                Watch This Short Video First Before Registering
              </div>
              
              <div className="lp-video-card-container">
                <wistia-player 
                  media-id="n7ski2kp6w" 
                  aspect="0.5625" 
                  style={{ width: '100%', height: '100%', display: 'block' }}
                ></wistia-player>
              </div>
            </div>

            {/* RIGHT COLUMN: OPT-IN FORM */}
            <div className="lp-form-col" id="opt-in-form-top">
              <div className="lp-form-card">
                <h3 className="lp-form-headline">YES! Give Me Instant FREE Access To The Training</h3>
                <p className="lp-form-subtext">Enter your details below and get immediate access — 100% Free. No credit card. No catch.</p>
                
                {submitted ? (
                  <div className="lp-success-badge">
                    <span className="lp-success-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <h4>Access Granted Successfully!</h4>
                    <p>Redirecting you to the free training workspace...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="lp-form">
                    {errorMsg && <div className="lp-form-error">{errorMsg}</div>}
                    
                    <div className="lp-input-wrapper">
                      <label htmlFor="lp-name-top">Full Name</label>
                      <input 
                        type="text" 
                        id="lp-name-top" 
                        placeholder="Enter your full name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="lp-input-wrapper">
                      <label htmlFor="lp-email-top">Email Address</label>
                      <input 
                        type="email" 
                        id="lp-email-top" 
                        placeholder="Enter your best email address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="lp-input-wrapper">
                      <label htmlFor="lp-phone-top">WhatsApp Phone Number</label>
                      <input 
                        type="tel" 
                        id="lp-phone-top" 
                        placeholder="e.g. 08012345678" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required 
                      />
                    </div>

                    <button type="submit" className="lp-cta-button" disabled={submitting}>
                      {submitting ? (
                        <span className="lp-btn-loading-wrapper">
                          <svg className="lp-spinner" viewBox="0 0 24 24">
                            <circle className="path" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                          </svg>
                          SECURING YOUR SEAT...
                        </span>
                      ) : (
                        "GIVE ME FREE ACCESS NOW →"
                      )}
                    </button>

                    <div className="lp-form-trust">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Your Information Is 100% Safe & Will Never Be Shared. This Is Completely FREE.
                    </div>
                    
                    <div className="lp-form-scarcity">
                      Spots Are Filling Up Fast — Register Now Before This Page Is Taken Down
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* SECTION 5 — WHAT YOU WILL LEARN */}
      <section className="lp-what-learn" ref={el => animatedElements.current[0] = el}>
        <div className="lp-section-inner">
          <h2 className="lp-section-title">
            Here Is EXACTLY What You Will Discover Inside This <span className="highlight-underline">FREE Training</span>…
          </h2>
          
          <div className="lp-intro-block">
            <p className="lp-intro-lead">Look — I am going to be completely straight with you.</p>
            <p>
              Business owners all over the world — in the UK, USA, Canada, Australia, and right here in Nigeria — are desperately looking for people who can build websites for them. They are not looking for computer scientists. They are not looking for engineers with 10-year degrees. They are looking for ordinary people. People just like <strong>YOU</strong>.
            </p>
            <p>
              And with the power of AI and simple drag-and-drop tools, you can become that person starting <strong>TODAY</strong>. No coding. No experience. No expensive laptop required. Just your phone, your data subscription, and this training.
            </p>
            <p className="lp-intro-closing">Inside this FREE training, here is what you are going to get:</p>
          </div>

          <div className="lp-bullets-grid">
            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to build TWO complete, professional, stunning websites</strong> for real business owners — inside this very training — step by step, from scratch</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to use FREE AI tools and drag-and-drop website builders</strong> that do 90% of the work FOR you — even if you are not tech-savvy at all</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to land your first paying client</strong> even before you finish the training — and charge them ₦50,000 to ₦500,000+ per website</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to work from anywhere</strong> — your bedroom, a café, your sitting room — and deliver results to clients in any country on earth</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to earn in Dollars, Pounds, and Naira</strong> — directly into your Nigerian bank account or through platforms like PayPal, Wise, and Grey</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How ordinary Nigerians with zero tech background</strong> are already making 6-figure monthly incomes from this ONE skill — and exactly how you can too</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>Why this skill is one of the highest-income freelance skills</strong> in the world right now — and why the demand is only growing every single day</p>
            </div>

            <div className="lp-bullet-item">
              <span className="lp-bullet-checkmark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <p><strong>How to do all of this in less than 10 minutes after joining</strong> — this is not theory. This is a 100% hands-on, practical training where you WILL build a website before you leave</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — AI & OPPORTUNITY SECTION */}
      <section className="lp-opportunity" ref={el => animatedElements.current[1] = el}>
        <div className="lp-section-inner">
          <h2 className="lp-section-title dark-text">The World Is Changing. AI Is Taking Over. Are You Going To Watch — Or Cash In?</h2>
          
          <div className="lp-opp-copy">
            <p>Artificial Intelligence is not the future anymore. It is the present. <strong>RIGHT NOW.</strong></p>
            
            <p>Companies around the world are using AI to replace old jobs. But smart people are using AI to create new income streams — ones that pay more than most 9-5 jobs in Nigeria ever will.</p>
            
            <p>Building websites with AI is one of the fastest, most beginner-friendly, and most profitable ways to make money online today.</p>
            
            <div className="lp-opp-focus-box">
              <p><strong>Think about it:</strong></p>
              <p>
                Every business in the world needs a website. From the small shop owner in Surulere to the restaurant chain in London. From the fashion brand in Toronto to the dental clinic in Texas. They ALL need to be online. They ALL need someone to help them.
              </p>
              <p className="highlight-focus-text">That someone can be <strong>YOU</strong>.</p>
            </div>

            <p>And while your colleagues are scrolling social media, you could be building websites from your bedroom and getting paid in foreign currency — in your pajamas — without ever meeting your client face to face.</p>
            
            <p className="lp-cta-paragraph">The only question is: Will you take action today?</p>
            
            <p className="lp-opp-bold-conclusion">
              This free training removes EVERY excuse. <br />
              No coding. No money. No experience needed. Just you, your phone, and 10 minutes of your time.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TESTIMONIALS (4 Cards, Grid Layout) */}
      <section className="lp-testimonials" ref={el => animatedElements.current[2] = el}>
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Approved by Ordinary Nigerians</h2>
          <p className="lp-section-subtitle">Read how our training has transformed these students into freelance website designers:</p>
          
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="lp-testimonial-card">
                <div className="lp-stars-container">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="lp-star-icon" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
                
                <p className="lp-testimonial-quote">"{t.quote}"</p>
                
                <div className="lp-testimonial-user">
                  <img src={t.avatar} alt={t.name} className="lp-testimonial-avatar" />
                  <div className="lp-testimonial-user-info">
                    <span className="lp-testimonial-name">— {t.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — PAYMENT SCREENSHOT SOCIAL PROOF */}
      <section className="lp-payment-proof" ref={el => animatedElements.current[3] = el}>
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Real Results. Real Money.</h2>
          <p className="lp-section-subtitle">These are actual payment screenshots of payments I received from my web design clients:</p>
          
          <div className="lp-screenshots-layout">
            <div className="lp-screenshots-grid">
              {PROOF_IMAGES.map((img, idx) => (
                <div key={idx} className="lp-screenshot-card">
                  <img src={img.src} alt={img.alt} className="lp-screenshot-img" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA SECTION (Repeat Opt-In Form) */}
      <section className="lp-final-cta-sec" ref={el => animatedElements.current[4] = el}>
        <div className="lp-section-inner">
          <h2 className="lp-final-headline">This Page Will NOT Be Here For Long.</h2>
          
          <p className="lp-final-paragraph">
            Because of the sheer value packed into this free training — I reserve the right to take this page down at any moment without warning.
          </p>
          <p className="lp-final-paragraph">
            If you are reading this right now, you are one of the lucky ones. Do not waste this opportunity.
          </p>
          <p className="lp-final-paragraph bold-warning">
            Register now. It takes less than 60 seconds. And it is 100% free.
          </p>

          <div className="lp-form-col-bottom">
            <div className="lp-form-card">
              <h3 className="lp-form-headline">YES! Give Me Instant FREE Access To The Training</h3>
              <p className="lp-form-subtext">Enter your details below and get immediate access — 100% Free. No credit card. No catch.</p>
              
              {submitted ? (
                <div className="lp-success-badge">
                  <span className="lp-success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <h4>Access Granted Successfully!</h4>
                  <p>Redirecting you to the free training workspace...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="lp-form">
                  {errorMsg && <div className="lp-form-error">{errorMsg}</div>}
                  
                  <div className="lp-input-wrapper">
                    <label htmlFor="lp-name-bottom">Full Name</label>
                    <input 
                      type="text" 
                      id="lp-name-bottom" 
                      placeholder="Enter your full name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="lp-input-wrapper">
                    <label htmlFor="lp-email-bottom">Email Address</label>
                    <input 
                      type="email" 
                      id="lp-email-bottom" 
                      placeholder="Enter your best email address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="lp-input-wrapper">
                    <label htmlFor="lp-phone-bottom">WhatsApp Phone Number</label>
                    <input 
                      type="tel" 
                      id="lp-phone-bottom" 
                      placeholder="e.g. 08012345678" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>

                  <button type="submit" className="lp-cta-button pulsing-animation" disabled={submitting}>
                    {submitting ? (
                      <span className="lp-btn-loading-wrapper">
                        <svg className="lp-spinner" viewBox="0 0 24 24">
                          <circle className="path" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                        </svg>
                        SECURING YOUR SEAT...
                      </span>
                    ) : (
                      "CLAIM MY FREE SPOT NOW — BEFORE IT'S GONE →"
                    )}
                  </button>

                  <div className="lp-form-trust">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Your Information Is 100% Safe & Will Never Be Shared. This Is Completely FREE.
                  </div>
                  
                  <div className="lp-form-scarcity">
                    Spots Are Filling Up Fast — Register Now Before This Page Is Taken Down
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
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

      {/* SECTION 4 — SOCIAL PROOF NOTIFICATION WIDGET */}
      {showToast && currentNotification && (
        <div className="lp-sales-toast">
          <div className="toast-border-accent"></div>
          <div className="toast-content">
            <p className="toast-title">Verified Registration</p>
            <p className="toast-body">
              <strong>{currentNotification.text.split(' just ')[0]}</strong> just joined the free training!
            </p>
          </div>
        </div>
      )}

      {/* INJECTED STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');

        /* BASE STYLING WRAPPER */
        .lp-container-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #F9F9F9;
          color: #1A1A1A;
          line-height: 1.6;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        /* SECTION 1: STICKY URGENCY BAR */
        .lp-urgency-bar {
          background-color: #f59e0b;
          color: #0A0F2C;
          font-weight: 700;
          font-size: 13px;
          text-align: center;
          padding: 12px 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .lp-urgency-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .lp-blinking-dot {
          width: 8px;
          height: 8px;
          background-color: #FFFFFF;
          border-radius: 50%;
          display: inline-block;
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.1; }
          100% { opacity: 1; }
        }

        /* UNIFIED HERO BACKGROUND WRAPPER */
        .lp-hero-wrapper {
          background: linear-gradient(135deg, #0A0F2C 0%, #151C47 100%);
          padding: 60px 20px 80px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* SECTION 2: HERO TOP HEADLINES */
        .lp-hero-top {
          text-align: center;
          margin-bottom: 48px;
        }
        .lp-hero-content {
          max-width: 960px;
          margin: 0 auto;
        }
        .lp-badge {
          display: inline-flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 6px 14px;
          border-radius: 30px;
          margin-bottom: 24px;
        }
        .lp-hero-headline {
          font-family: 'Asimov', sans-serif;
          font-size: clamp(24px, 4vw, 40px);
          font-weight: 800;
          line-height: 1.35;
          margin-bottom: 24px;
          color: #FFFFFF;
        }
        .lp-hero-headline .highlight-orange {
          color: #f59e0b;
        }
        .lp-hero-headline .highlight-underline {
          background-image: linear-gradient(120deg, #FFD700 0%, #FFD700 100%);
          background-repeat: no-repeat;
          background-size: 100% 0.12em;
          background-position: 0 95%;
          display: inline-block;
        }
        .lp-hero-subheadline {
          font-size: clamp(14px, 1.8vw, 17px);
          line-height: 1.65;
          color: #CBD5E1;
          max-width: 840px;
          margin: 0 auto;
        }

        /* SECTION 3: TWO-COLUMN FORM & VIDEO LAYOUT */
        .lp-two-column-sec {
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-two-column-wrapper {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center; /* Vertically center columns on desktop */
        }
        
        /* VIDEO LEFT COLUMN */
        .lp-video-col {
          display: flex;
          flex-direction: column;
          gap: 0px; /* Zero gap between label and video as requested */
          width: 100%;
        }
        .lp-video-title {
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          padding: 12px 16px;
          background-color: #0A0F2C;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: none;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          line-height: 1.2;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .lp-video-card-container {
          background: #000000;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          aspect-ratio: 9/16;
          display: flex;
          flex-direction: column;
        }
        wistia-player {
          display: block;
          width: 100%;
          height: 100%;
        }
        wistia-player[media-id='n7ski2kp6w']:not(:defined) {
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/n7ski2kp6w/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 177.78%;
        }

        /* FORM RIGHT COLUMN */
        .lp-form-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border-top: 5px solid #f59e0b;
          padding: 36px 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .lp-form-headline {
          font-family: 'FrankoSub', sans-serif;
          font-size: clamp(18px, 2.5vw, 22px);
          font-weight: 900;
          color: #0A0F2C;
          text-align: center;
          margin-bottom: 12px;
          line-height: 1.35;
        }
        .lp-form-subtext {
          font-size: 13.5px;
          color: #4B5563;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .lp-form-error {
          background-color: #FEF2F2;
          border-left: 4px solid #EF4444;
          color: #B91C1C;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 4px;
        }
        .lp-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-input-wrapper label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #4B5563;
          letter-spacing: 0.5px;
        }
        .lp-input-wrapper input {
          padding: 12px 16px;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          outline: none;
          color: #1A1A1A;
          transition: all 0.2s ease;
          background-color: #F9FAFB;
        }
        .lp-input-wrapper input:focus {
          border-color: #f59e0b;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }
        .lp-cta-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #FFFFFF;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 18px;
          padding: 18px 24px;
          border-radius: 8px;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
          animation: pulseGlow 2.5s infinite;
          letter-spacing: 0.3px;
        }
        .lp-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }
        .lp-cta-button:disabled {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          color: #FFFFFF;
          cursor: not-allowed;
          animation: submittingPulse 1.5s infinite ease-in-out;
          box-shadow: none;
          opacity: 0.9;
        }

        .lp-btn-loading-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .lp-spinner {
          animation: rotate 2s linear infinite;
          width: 20px;
          height: 20px;
        }

        .lp-spinner .path {
          stroke: #ffffff;
          stroke-linecap: round;
          animation: dash 1.5s ease-in-out infinite;
        }

        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }

        @keyframes submittingPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        .lp-form-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-align: center;
          line-height: 1.4;
        }
        .lp-form-trust svg {
          flex-shrink: 0;
          color: #9CA3AF;
        }
        .lp-form-scarcity {
          background-color: #FFFBEB;
          border: 1px dashed #F59E0B;
          color: #D97706;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          padding: 10px;
          border-radius: 6px;
          line-height: 1.4;
        }
        .lp-success-badge {
          text-align: center;
          padding: 40px 10px;
        }
        .lp-success-icon {
          color: #22C55E;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #DCFCE7;
          border-radius: 50%;
          padding: 12px;
          margin-bottom: 16px;
        }
        .lp-success-badge h4 {
          font-size: 18px;
          color: #15803D;
          font-weight: 850;
          margin-bottom: 8px;
        }
        .lp-success-badge p {
          color: #4B5563;
          font-size: 14.5px;
        }

        /* SECTION 5: WHAT YOU WILL LEARN */
        .lp-what-learn {
          background-color: #FFFFFF;
          padding: 80px 20px;
          border-top: 1px solid #E5E7EB;
        }
        .lp-section-inner {
          max-width: 860px;
          margin: 0 auto;
        }
        .lp-section-title {
          font-family: 'Asimov', sans-serif;
          font-size: clamp(22px, 3.5vw, 32px);
          font-weight: 800;
          color: #0A0F2C;
          text-align: center;
          margin-bottom: 36px;
          line-height: 1.35;
        }
        .lp-section-title.dark-text {
          color: #0A0F2C;
        }
        .lp-intro-block {
          font-size: 15.5px;
          color: #374151;
          margin-bottom: 40px;
        }
        .lp-intro-block p {
          margin-bottom: 18px;
          line-height: 1.7;
        }
        .lp-intro-lead {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
        }
        .lp-intro-closing {
          font-weight: 700;
          margin-top: 30px;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 12px;
          color: #111827;
        }
        .lp-bullets-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .lp-bullet-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .lp-bullet-checkmark {
          background-color: #F0FDF4;
          color: #22C55E;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #BBF7D0;
        }
        .lp-bullet-item p {
          font-size: 15px;
          color: #374151;
          margin: 0;
          line-height: 1.65;
        }

        /* SECTION 6: AI & OPPORTUNITY */
        .lp-opportunity {
          background-color: #F9FAFB;
          padding: 80px 20px;
          border-top: 1px solid #E5E7EB;
          border-bottom: 1px solid #E5E7EB;
        }
        .lp-opp-copy {
          font-size: 15.5px;
          color: #374151;
        }
        .lp-opp-copy p {
          margin-bottom: 20px;
          line-height: 1.7;
        }
        .lp-opp-focus-box {
          background-color: #FFFFFF;
          border-left: 4px solid #f59e0b;
          padding: 24px;
          border-radius: 0 12px 12px 0;
          margin: 30px 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          border-top: 1px solid #F3F4F6;
          border-right: 1px solid #F3F4F6;
          border-bottom: 1px solid #F3F4F6;
        }
        .lp-opp-focus-box p {
          margin-bottom: 10px;
        }
        .lp-opp-focus-box p:last-child {
          margin-bottom: 0;
        }
        .highlight-focus-text {
          font-size: 17px;
          color: #d97706;
        }
        .lp-cta-paragraph {
          font-size: 18px;
          font-weight: 700;
          color: #0A0F2C;
          text-align: center;
          margin-top: 32px;
        }
        .lp-opp-bold-conclusion {
          font-size: 16px;
          font-weight: 700;
          color: #d97706;
          text-align: center;
          line-height: 1.5;
          margin-top: 10px;
        }

        /* SECTION 7: TESTIMONIALS (4 Cards) */
        .lp-testimonials {
          background-color: #FFFFFF;
          padding: 80px 20px;
        }
        .lp-section-subtitle {
          font-size: 15.5px;
          color: #4B5563;
          text-align: center;
          margin-top: -24px;
          margin-bottom: 40px;
          line-height: 1.5;
        }
        .lp-testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .lp-testimonial-card {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
          transition: transform 0.2s ease;
        }
        .lp-testimonial-card:hover {
          transform: translateY(-4px);
        }
        .lp-stars-container {
          display: flex;
          gap: 4px;
        }
        .lp-testimonial-quote {
          font-size: 14px;
          line-height: 1.65;
          color: #374151;
          font-style: italic;
          margin: 0;
          flex-grow: 1;
        }
        .lp-testimonial-user {
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid #E5E7EB;
          padding-top: 14px;
        }
        .lp-testimonial-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #0A0F2C;
        }
        .lp-testimonial-user-info {
          display: flex;
          flex-direction: column;
        }
        .lp-testimonial-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        /* SECTION 8: PAYMENT SCREENSHOT SOCIAL PROOF (Straight flat dashed borders as in Image 2) */
        .lp-payment-proof {
          background-color: #F9FAFB;
          padding: 80px 20px;
          border-top: 1px solid #E5E7EB;
        }
        .lp-screenshots-layout {
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-screenshots-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 24px;
        }
        .lp-screenshot-card {
          background-color: #FFFFFF;
          padding: 12px;
          border: 2px dashed #000000; /* Flat black dashed border */
          display: flex;
          justify-content: center;
          align-items: center;
          transform: none !important; /* No rotation */
          box-shadow: none !important; /* No drop shadows */
          border-radius: 0; /* Rectangular edge */
        }
        .lp-screenshot-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* SECTION 9: FINAL CTA SECTION */
        .lp-final-cta-sec {
          background: linear-gradient(135deg, #0A0F2C 0%, #151C47 100%);
          color: #FFFFFF;
          padding: 80px 20px;
          text-align: center;
        }
        .lp-final-headline {
          font-family: 'Asimov', sans-serif;
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 800;
          margin-bottom: 20px;
        }
        .lp-final-paragraph {
          font-size: 15.5px;
          color: #E2E8F0;
          max-width: 700px;
          margin: 0 auto 16px;
        }
        .lp-final-paragraph.bold-warning {
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 40px;
        }
        .lp-form-col-bottom {
          max-width: 480px;
          margin: 0 auto;
          text-align: left;
        }

        /* SECTION 10: FOOTER */
        .lp-footer {
          background-color: #0A0F2C;
          color: #9CA3AF;
          padding: 48px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
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

        /* REDESIGNED VERIFIED SALES TOAST */
        .lp-sales-toast {
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
          background: #f59e0b;
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
          color: #f59e0b !important;
          text-align: left;
        }
        .toast-body {
          margin: 0 !important;
          font-size: 13px;
          color: #ffffff !important;
          font-weight: 500;
          line-height: 1.4;
          text-align: left;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* SCROLL ENTRANCE ANIMATIONS */
        .lp-what-learn,
        .lp-opportunity,
        .lp-testimonials,
        .lp-payment-proof,
        .lp-final-cta-sec {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .lp-what-learn.visible,
        .lp-opportunity.visible,
        .lp-testimonials.visible,
        .lp-payment-proof.visible,
        .lp-final-cta-sec.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* MEDIA QUERIES: RESPONSIVE SCREEN ADJUSTMENTS */
        @media (max-width: 479px) {
          .lp-screenshots-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        @media (min-width: 480px) and (max-width: 991px) {
          .lp-screenshots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .lp-hero-wrapper {
            padding: 90px 24px 100px;
          }
          .lp-two-column-wrapper {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: stretch;
          }
          .lp-video-col {
            align-items: center;
          }
          .lp-bullets-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .lp-testimonials-grid {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .lp-video-card-container {
            width: 100%;
            max-width: 480px;
            aspect-ratio: 9/16;
          }
        }

        @media (min-width: 992px) {
          .lp-screenshots-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
