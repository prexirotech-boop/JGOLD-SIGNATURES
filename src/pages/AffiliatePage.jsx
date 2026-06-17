import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } },
      { threshold: 0.15, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const end = value
    prev.current = end
    if (start === end) return
    const startTime = performance.now()
    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}

// ─── Commission tiers data ────────────────────────────────────────────────────
const TIERS = [
  {
    emoji: '🥉',
    name: 'Bronze',
    range: '0 – 5 sales',
    rate: 20,
    color: '#a05c34',
    gradient: 'linear-gradient(135deg, #a05c34 0%, #7c4a28 100%)',
    border: 'rgba(160, 92, 52, 0.5)',
    glow: 'rgba(160, 92, 52, 0.2)',
    bg: 'rgba(160, 92, 52, 0.08)',
  },
  {
    emoji: '🥈',
    name: 'Silver',
    range: '6 – 20 sales',
    rate: 25,
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    border: 'rgba(148, 163, 184, 0.5)',
    glow: 'rgba(148, 163, 184, 0.2)',
    bg: 'rgba(148, 163, 184, 0.08)',
  },
  {
    emoji: '🥇',
    name: 'Gold',
    range: '21 – 50 sales',
    rate: 30,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.2)',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  {
    emoji: '💎',
    name: 'Platinum',
    range: '50+ sales',
    rate: 35,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    border: 'rgba(139, 92, 246, 0.5)',
    glow: 'rgba(139, 92, 246, 0.25)',
    bg: 'rgba(139, 92, 246, 0.08)',
  },
]

const AVG_PRICE = 15000

function getTier(sales) {
  if (sales <= 5) return TIERS[0]
  if (sales <= 20) return TIERS[1]
  if (sales <= 50) return TIERS[2]
  return TIERS[3]
}

const FAQS = [
  {
    q: 'When do I get paid?',
    a: 'Payouts are processed monthly, on the 1st of every month. You need a minimum balance of ₦5,000 to trigger a payout. Earnings below this roll over to the next month.',
  },
  {
    q: 'How long is the cookie duration?',
    a: 'Our affiliate cookies last 30 days. That means if someone clicks your link today and purchases anytime within 30 days, you earn the commission — no matter how many times they visit.',
  },
  {
    q: 'What products can I promote?',
    a: 'You can promote every published product on Amplified Skills — all courses, ebooks, and digital downloads. New products are added regularly, giving you fresh content to promote.',
  },
  {
    q: 'Is there a limit on how much I can earn?',
    a: 'Absolutely not! There is zero cap on your earnings. The more you share, the more you earn. Our top affiliates earn six figures monthly promoting our products to their audiences.',
  },
  {
    q: 'How do I get my affiliate link?',
    a: 'Simply create a free account on Amplified Skills. Your personal affiliate link is generated automatically and available instantly in your dashboard under the "Affiliate" tab.',
  },
  {
    q: 'Can I track my referrals in real time?',
    a: 'Yes! Your affiliate dashboard gives you real-time visibility into clicks, conversions, and earnings. You can see exactly which promotions are working best.',
  },
]

const BENEFITS = [
  {
    icon: '📊',
    title: 'Real-Time Dashboard',
    desc: 'Track clicks, conversions, and earnings live with your personal affiliate dashboard.',
  },
  {
    icon: '🍪',
    title: '30-Day Cookie',
    desc: 'Earn commission on any purchase made within 30 days of your referral click.',
  },
  {
    icon: '💸',
    title: 'Monthly Payouts',
    desc: 'Get paid every month directly to your bank account. No delays, no excuses.',
  },
  {
    icon: '🎯',
    title: 'No Minimum to Join',
    desc: 'Sign up for free and start earning immediately. Zero upfront cost required.',
  },
  {
    icon: '⚡',
    title: 'Instant Access',
    desc: 'Get your unique affiliate link the moment you create your account. No approval wait.',
  },
  {
    icon: '🤝',
    title: 'Dedicated Support',
    desc: 'Our affiliate team is available to help you maximise your earnings and strategy.',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AffiliatePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [salesCount, setSalesCount] = useState(10)
  const [openFaq, setOpenFaq] = useState(null)
  const [affiliateCount, setAffiliateCount] = useState(1200)
  const [hoveredTier, setHoveredTier] = useState(null)
  const [hoveredBenefit, setHoveredBenefit] = useState(null)

  const affiliateLink = profile?.affiliate_code
    ? `${window.location.origin}/?ref=${profile.affiliate_code}`
    : null

  async function handleCopyLink() {
    if (affiliateLink) {
      await navigator.clipboard.writeText(affiliateLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('affiliate_code', 'is', null)
      .then(({ count }) => {
        if (count && count > 0) setAffiliateCount(count)
      })
  }, [])

  const currentTier = getTier(salesCount)
  const monthlyEarnings = Math.round(salesCount * AVG_PRICE * (currentTier.rate / 100))

  const [heroRef, heroInView] = useInView()
  const [howRef, howInView] = useInView()
  const [tierRef, tierInView] = useInView()
  const [calcRef, calcInView] = useInView()
  const [benefitsRef, benefitsInView] = useInView()
  const [faqRef, faqInView] = useInView()
  const [ctaRef, ctaInView] = useInView()

  const fadeIn = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(32px)',
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  })

  const font = { fontFamily: 'var(--font, Inter, sans-serif)' }

  return (
    <div style={{ ...font, background: '#09090f', color: '#e2e8f0', overflowX: 'hidden' }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34,197,94,0.9); }
          50%       { opacity: 0.5; box-shadow: 0 0 3px rgba(34,197,94,0.4); }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-18px) scale(1.03); }
        }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 14px rgba(139,92,246,0.7);
          cursor: pointer;
          border: 3px solid #fff;
          margin-top: -9px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 6px; border-radius: 3px;
          background: linear-gradient(to right, #8b5cf6, #6d28d9);
        }
        input[type=range]::-moz-range-thumb {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 14px rgba(139,92,246,0.7);
          cursor: pointer;
          border: 3px solid #fff;
        }
        .aff-how-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .aff-how-card:hover { transform: translateY(-8px) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.18) !important; }
        .aff-tier-card { transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default; }
        .aff-tier-card:hover { transform: translateY(-8px) scale(1.025) !important; }
        .aff-benefit-card { transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease; }
        .aff-benefit-card:hover { transform: translateY(-4px); }
        .aff-btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: #fff; padding: 14px 36px; border-radius: 14px;
          font-weight: 700; font-size: 15px; text-decoration: none;
          border: none; cursor: pointer;
          box-shadow: 0 4px 24px rgba(139,92,246,0.4);
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
          font-family: var(--font, Inter, sans-serif);
        }
        .aff-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 36px rgba(139,92,246,0.6); filter: brightness(1.1); }
        .aff-btn-ghost {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.07);
          color: #e2e8f0; padding: 14px 28px; border-radius: 14px;
          font-weight: 600; font-size: 15px; text-decoration: none;
          border: 1px solid rgba(255,255,255,0.14);
          transition: background 0.25s ease, transform 0.25s ease;
          font-family: var(--font, Inter, sans-serif);
        }
        .aff-btn-ghost:hover { background: rgba(255,255,255,0.14); transform: translateY(-3px); }
        .aff-faq-item { transition: border-color 0.3s ease; }
        .aff-faq-item[data-open="true"] { border-color: rgba(139,92,246,0.4) !important; }
        .aff-copy-btn {
          padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
          font-weight: 700; font-size: 13px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          font-family: var(--font, Inter, sans-serif);
          white-space: nowrap; flex-shrink: 0;
        }
        .aff-copy-btn:hover { transform: scale(1.04); }
      `}</style>

      {/* ════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(150deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
          overflow: 'hidden',
          padding: '120px 24px 100px',
        }}
      >
        {/* Orbs */}
        <div style={{
          position: 'absolute', top: '-18%', left: '-12%',
          width: '650px', height: '650px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
          animation: 'float-orb 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-22%', right: '-12%',
          width: '750px', height: '750px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
          filter: 'blur(65px)', pointerEvents: 'none',
          animation: 'float-orb 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '45%', left: '45%',
          width: '450px', height: '450px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.13) 0%, transparent 70%)',
          filter: 'blur(55px)', pointerEvents: 'none',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto', ...fadeIn(heroInView) }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '100px', padding: '7px 20px',
            fontSize: '13px', fontWeight: 700, color: '#c4b5fd',
            marginBottom: '30px', letterSpacing: '0.4px',
          }}>
            💰 Amplified Skills Affiliate Program
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.6rem, 6.5vw, 4.5rem)',
            fontWeight: 900, lineHeight: 1.08, marginBottom: '22px',
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Earn Money<br />Sharing Skills
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#94a3b8',
            lineHeight: 1.75, marginBottom: '32px',
            maxWidth: '560px', margin: '0 auto 32px',
          }}>
            Join the Amplified Skills Affiliate Program and earn up to{' '}
            <strong style={{ color: '#c4b5fd', fontWeight: 800 }}>35% commission</strong> on every
            sale you refer. No experience needed, no upfront cost — just share and earn.
          </p>

          {/* Live stat */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '100px', padding: '9px 22px',
            fontSize: '13px', color: '#94a3b8', marginBottom: '40px',
          }}>
            <span style={{
              width: '9px', height: '9px', borderRadius: '50%',
              background: '#22c55e', flexShrink: 0,
              animation: 'pulse-dot 2s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(34,197,94,0.9)',
            }} />
            Join <strong style={{ color: '#e2e8f0', margin: '0 5px' }}>{affiliateCount.toLocaleString()}+</strong> affiliates already earning
          </div>

          {/* Conditional CTAs */}
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {affiliateLink && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  borderRadius: '18px', padding: '22px 26px',
                  maxWidth: '560px', width: '100%', backdropFilter: 'blur(14px)',
                }}>
                  <p style={{
                    fontSize: '11px', fontWeight: 700, color: '#64748b',
                    letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px',
                  }}>
                    🔗 Your Affiliate Link
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      flex: 1, background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px', padding: '11px 14px',
                      fontSize: '13px', color: '#c4b5fd', fontFamily: 'monospace',
                      minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {affiliateLink}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="aff-copy-btn"
                      style={{
                        background: copied
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        color: '#fff',
                        boxShadow: copied
                          ? '0 4px 16px rgba(34,197,94,0.4)'
                          : '0 4px 16px rgba(139,92,246,0.4)',
                      }}
                    >
                      {copied ? '✓ Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              )}
              <Link to="/dashboard?tab=affiliate" className="aff-btn-primary">
                <span>🚀</span> Start Earning Now
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="aff-btn-primary">
                <span>✨</span> Create Free Account
              </Link>
              <Link to="/login" className="aff-btn-ghost">
                Already have an account? Log in →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <div style={{ background: '#f8faff', padding: '100px 24px' }}>
        <div ref={howRef} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6d28d9', marginBottom: '12px', textAlign: 'center' }}>
            Simple Process
          </p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: '#1a1f36', textAlign: 'center', marginBottom: '14px', lineHeight: 1.2 }}>
            How It Works
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '0 auto 64px', lineHeight: 1.75 }}>
            Three simple steps stand between you and your first commission check.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', position: 'relative' }}>
            {[
              { step: 1, emoji: '🔗', title: 'Get Your Unique Link', desc: 'Sign up for free and receive your personal affiliate link instantly. No approval process, no waiting — immediate access the moment you register.', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
              { step: 2, emoji: '📣', title: 'Share With Your Audience', desc: 'Share on WhatsApp, Instagram, Twitter, YouTube, your blog — anywhere. The more channels you use and the more consistently you share, the more you earn.', bg: 'linear-gradient(135deg, #6366f1, #4338ca)' },
              { step: 3, emoji: '💰', title: 'Earn 20–35% Commission', desc: 'Earn real money on every successful sale you refer within 30 days of your link click. Commissions grow as your referral count increases.', bg: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
            ].map((item, i) => (
              <div
                key={i}
                className="aff-how-card"
                style={{
                  background: '#fff',
                  borderRadius: '22px',
                  padding: '38px 30px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                  textAlign: 'center',
                  position: 'relative',
                  ...fadeIn(howInView, i * 120),
                }}
              >
                {/* Step number bubble */}
                <div style={{
                  position: 'absolute', top: '-14px', left: '-14px',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(139,92,246,0.55)',
                }}>
                  {item.step}
                </div>
                {/* Icon */}
                <div style={{
                  width: '76px', height: '76px', borderRadius: '22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '34px', margin: '0 auto 22px',
                  background: item.bg,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                }}>
                  {item.emoji}
                </div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1a1f36', marginBottom: '12px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.93rem', color: '#64748b', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          3. COMMISSION TIERS
      ════════════════════════════════════════════════════ */}
      <div style={{ padding: '100px 24px', background: '#09090f' }}>
        <div ref={tierRef} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: '12px', textAlign: 'center' }}>
            Commission Structure
          </p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: '14px', lineHeight: 1.2 }}>
            Earn More As You Grow
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '0 auto 64px', lineHeight: 1.75 }}>
            Your commission rate automatically upgrades as you refer more sales. Based on an average product price of ₦15,000.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '22px' }}>
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className="aff-tier-card"
                onMouseEnter={() => setHoveredTier(i)}
                onMouseLeave={() => setHoveredTier(null)}
                style={{
                  borderRadius: '22px', padding: '32px 26px',
                  textAlign: 'center',
                  border: `1px solid ${tier.border}`,
                  background: tier.bg,
                  boxShadow: hoveredTier === i ? `0 20px 60px ${tier.glow}` : `0 6px 28px ${tier.glow}`,
                  position: 'relative', overflow: 'hidden',
                  ...fadeIn(tierInView, i * 110),
                }}
              >
                {/* Top glow */}
                <div style={{
                  position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                  width: '140px', height: '140px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)`,
                  filter: 'blur(24px)', pointerEvents: 'none',
                }} />

                <span style={{ fontSize: '3.2rem', marginBottom: '14px', display: 'block' }}>
                  {tier.emoji}
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: tier.color, marginBottom: '5px' }}>
                  {tier.name}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', opacity: 0.65, color: tier.color, marginBottom: '22px' }}>
                  {tier.range}
                </div>
                <div style={{ fontSize: '3.2rem', fontWeight: 900, color: tier.color, lineHeight: 1, marginBottom: '6px' }}>
                  {tier.rate}%
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px' }}>
                  Commission Rate
                </div>

                {/* Example earnings */}
                <div style={{
                  background: 'rgba(0,0,0,0.28)', borderRadius: '12px',
                  padding: '14px', border: `1px solid ${tier.border}`,
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    Per sale you refer
                  </div>
                  <div style={{ fontWeight: 800, color: tier.color, fontSize: '1.2rem', marginBottom: '10px' }}>
                    ₦{Math.round(AVG_PRICE * tier.rate / 100).toLocaleString()}
                  </div>
                  <div style={{ borderTop: `1px solid ${tier.border}`, paddingTop: '10px', fontSize: '12px', color: '#64748b' }}>
                    10 sales/mo ={' '}
                    <strong style={{ color: '#e2e8f0' }}>
                      ₦{(10 * Math.round(AVG_PRICE * tier.rate / 100)).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          4. EARNINGS CALCULATOR
      ════════════════════════════════════════════════════ */}
      <div style={{
        padding: '100px 24px',
        background: 'rgba(139,92,246,0.03)',
        borderTop: '1px solid rgba(139,92,246,0.12)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
      }}>
        <div ref={calcRef} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: '12px', textAlign: 'center' }}>
            Earnings Calculator
          </p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: '14px', lineHeight: 1.2 }}>
            What Could You Earn?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '0 auto 60px', lineHeight: 1.75 }}>
            Drag the slider to estimate your monthly affiliate income based on your referral volume.
          </p>

          <div style={{
            ...fadeIn(calcInView),
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.06) 100%)',
            border: '1px solid rgba(139,92,246,0.22)',
            borderRadius: '26px', padding: 'clamp(32px, 6vw, 60px) clamp(24px, 6vw, 56px)',
            maxWidth: '700px', margin: '0 auto', backdropFilter: 'blur(12px)',
          }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#94a3b8', marginBottom: '26px', textAlign: 'center' }}>
              How many sales per month?{' '}
              <strong style={{ color: '#c4b5fd', fontSize: '1.4em', fontWeight: 900 }}>{salesCount}</strong>
            </p>

            {/* Slider */}
            <input
              type="range" min={1} max={100} value={salesCount}
              onChange={e => setSalesCount(Number(e.target.value))}
              style={{
                width: '100%', height: '6px', borderRadius: '3px',
                outline: 'none', cursor: 'pointer', marginBottom: '10px',
                background: `linear-gradient(to right, #8b5cf6 ${salesCount}%, rgba(255,255,255,0.1) ${salesCount}%)`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '40px' }}>
              <span>1 sale</span><span>100 sales</span>
            </div>

            {/* Result */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                Estimated monthly earnings
              </div>
              <div style={{
                fontSize: 'clamp(2.8rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '8px',
                background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                ₦<AnimatedNumber value={monthlyEarnings} duration={450} />
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '22px' }}>
                At {currentTier.rate}% commission × ₦{AVG_PRICE.toLocaleString()} avg price × {salesCount} sales
              </div>

              {/* Tier badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                borderRadius: '100px', padding: '9px 22px',
                background: currentTier.bg,
                border: `1px solid ${currentTier.border}`,
                color: currentTier.color, fontSize: '14px', fontWeight: 700,
              }}>
                <span>{currentTier.emoji}</span>
                {currentTier.name} Tier — {currentTier.rate}% Commission
              </div>

              {/* Annual projection */}
              <div style={{
                marginTop: '26px', padding: '18px 20px',
                background: 'rgba(0,0,0,0.22)', borderRadius: '14px',
                fontSize: '14px', color: '#64748b', lineHeight: 1.75,
              }}>
                💡 That's{' '}
                <strong style={{ color: '#e2e8f0', fontSize: '1.05em' }}>
                  ₦{(monthlyEarnings * 12).toLocaleString()}
                </strong>{' '}
                per year —{' '}
                {monthlyEarnings >= 200000
                  ? 'enough to replace a full-time salary!'
                  : monthlyEarnings >= 80000
                  ? 'enough to cover rent and living expenses!'
                  : monthlyEarnings >= 30000
                  ? 'a solid passive side income stream!'
                  : 'a great start — scale up and earn more!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          5. WHY JOIN US — BENEFITS
      ════════════════════════════════════════════════════ */}
      <div style={{ padding: '100px 24px', background: '#09090f' }}>
        <div ref={benefitsRef} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: '12px', textAlign: 'center' }}>
            Why Choose Us
          </p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: '14px', lineHeight: 1.2 }}>
            Everything You Need to Succeed
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '0 auto 64px', lineHeight: 1.75 }}>
            We give you the tools, tracking, and support to maximise your earnings from day one.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className="aff-benefit-card"
                onMouseEnter={() => setHoveredBenefit(i)}
                onMouseLeave={() => setHoveredBenefit(null)}
                style={{
                  display: 'flex', gap: '18px', alignItems: 'flex-start',
                  background: hoveredBenefit === i ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${hoveredBenefit === i ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '18px', padding: '26px',
                  ...fadeIn(benefitsInView, i * 80),
                }}
              >
                <div style={{
                  width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(99,102,241,0.12))',
                  border: '1px solid rgba(139,92,246,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '7px' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '0.89rem', color: '#64748b', lineHeight: 1.65 }}>
                    {b.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          6. FAQ ACCORDION
      ════════════════════════════════════════════════════ */}
      <div style={{
        padding: '100px 24px',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div ref={faqRef} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: '12px', textAlign: 'center' }}>
            Got Questions?
          </p>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: '14px', lineHeight: 1.2 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '0 auto 60px', lineHeight: 1.75 }}>
            Everything you need to know before you get started.
          </p>

          <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', ...fadeIn(faqInView) }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className="aff-faq-item"
                  data-open={isOpen.toString()}
                  style={{
                    background: isOpen ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isOpen ? 'rgba(139,92,246,0.38)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px', overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '22px 26px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '18px', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font, Inter, sans-serif)',
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.45, flex: 1 }}>
                      {faq.q}
                    </span>
                    <span style={{
                      width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                      background: isOpen ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease, background 0.2s ease',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 26px 22px',
                      fontSize: '0.94rem', color: '#64748b', lineHeight: 1.75,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '18px',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          7. BOTTOM CTA BANNER
      ════════════════════════════════════════════════════ */}
      <div
        ref={ctaRef}
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(150deg, #1e1344 0%, #2d1b69 50%, #1a1044 100%)',
          borderTop: '1px solid rgba(139,92,246,0.22)',
          padding: '110px 24px',
          textAlign: 'center',
        }}
      >
        {/* Background orb */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, ...fadeIn(ctaInView) }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '14px' }}>
            Start Today — It's Free
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900, color: '#f1f5f9', marginBottom: '18px', lineHeight: 1.15 }}>
            Ready to Start Earning?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 44px', lineHeight: 1.75 }}>
            Join thousands of Nigerians already earning passive income by sharing
            premium skills content. Your affiliate link is waiting.
          </p>

          {/* CTAs */}
          {user ? (
            <Link to="/dashboard?tab=affiliate" className="aff-btn-primary" style={{ fontSize: '17px', padding: '17px 48px' }}>
              <span>🚀</span> Go to My Affiliate Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="aff-btn-primary" style={{ fontSize: '17px', padding: '17px 44px' }}>
                <span>✨</span> Create Free Account
              </Link>
              <Link to="/login" className="aff-btn-ghost" style={{ fontSize: '15px', padding: '17px 30px' }}>
                Log In to Dashboard
              </Link>
            </div>
          )}

          {/* Trust signals */}
          <div style={{
            display: 'flex', gap: '36px', justifyContent: 'center',
            flexWrap: 'wrap', marginTop: '44px',
          }}>
            {[
              { icon: '🔒', text: 'No upfront cost' },
              { icon: '⚡', text: 'Instant link access' },
              { icon: '📊', text: 'Real-time tracking' },
              { icon: '💸', text: 'Monthly payouts' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
